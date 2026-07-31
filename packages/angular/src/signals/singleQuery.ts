import { computed, DestroyRef, effect, Injector, linkedSignal, PendingTasks, signal, Signal, untracked, WritableSignal } from '@angular/core';
import { ErrorLike, NetworkStatus, OperationVariables as Variables } from '@apollo/client';
import { equal } from '@wry/equality';
import { finalize, noop, Subscription } from 'rxjs';
import { Apollo } from '../apollo';
import { emptyQueryResult, withPreviousData } from '../internal/queryResult';
import type { GetData, QueryOptions, QueryResult, SingleQueryResult } from '../types';
import type { SignalQueryExecOptions } from './query';
import type { SignalLazyVariablesOption } from './types';

/**
 * Assigned to the result of an execution that was cancelled before it produced one, either because newer variables
 * superseded it or because the query was terminated. Without it, a cancelled execution would be indistinguishable
 * from a query that completed with no data.
 */
export class SignalQueryCancelledError extends Error {
  public constructor() {
    super('Query execution was cancelled before it produced a result.');
    this.name = 'SignalQueryCancelledError';
  }
}

export type SignalSingleQueryOptions<TData = unknown, TVariables extends Variables = Variables> =
  & Omit<QueryOptions<TData, TVariables>, 'variables' | 'notifyOnLoading' | 'throwError'>
  & {
    /**
     * Whether or not to track initial network loading status.
     * @default true
     */
    notifyOnLoading?: boolean;

    /**
     * Whether to execute query immediately or lazily via `execute` method.
     */
    lazy?: boolean;

    /**
     * Custom injector to use for this query.
     */
    injector?: Injector;
  }
  & SignalLazyVariablesOption<NoInfer<TVariables>>;

/**
 * A query that fetches once per execution instead of watching the cache.
 *
 * Executes initially (unless `lazy`), whenever variables change and on `execute()`. Between executions the result
 * signal keeps its last value. Cache writes and refetches elsewhere in the application never re-emit into it.
 */
export class SignalSingleQuery<TData, TVariables extends Variables = Variables> {
  /**
   * The query result, containing `data`, `loading`, `error`, `networkStatus`, `previousData`, `dataState`.
   */
  public readonly result: Signal<QueryResult<TData, 'empty' | 'complete'>>;

  /**
   * If `true`, the query is currently in flight.
   */
  public readonly loading: Signal<boolean> = computed(() => this.result().loading);

  /**
   * The current network status of the query.
   */
  public readonly networkStatus: Signal<NetworkStatus> = computed(() => this.result().networkStatus);

  /**
   * The data returned by the query, or `undefined` if loading, errored, or no data received yet.
   */
  public readonly data: Signal<GetData<TData, 'empty' | 'complete'> | undefined> = computed(() => this.result().data);

  /**
   * The data from the previous execution, useful for displaying stale data while re-executing.
   */
  public readonly previousData: Signal<GetData<TData, 'empty' | 'complete'> | undefined> = computed(() => this.result().previousData);

  /**
   * An error object if the query failed, `undefined` otherwise.
   */
  public readonly error: Signal<ErrorLike | undefined> = computed(() => this.result().error);

  /**
   * A writable signal that represents the current query variables.
   */
  public readonly variables: WritableSignal<TVariables | undefined | null>;

  /**
   * Whether the query is currently active, having executed and not been terminated since.
   */
  public readonly active: Signal<boolean> = computed(() => this.execution() !== undefined);

  /**
   * Whether the query is currently enabled.
   *
   * This property starts as `true` for non-lazy queries and `false` for lazy queries.
   *
   * Calling `execute()` sets it to `true`, while calling `terminate()` sets it to `false`.
   *
   * When `true`:
   * - The query automatically executes when variables change from `null` to a non-null value
   * - Variable changes trigger re-execution with the new variables
   *
   * When `false`:
   * - Variable changes are ignored and do not trigger re-execution
   * - The query must be manually started via `execute()`
   *
   * Note: This is different from `active`, which indicates whether the query has executed and not been terminated since.
   */
  public readonly enabled: Signal<boolean>;

  private resolvePendingTask: (() => void) | undefined;
  private readonly execution: WritableSignal<{ variables: TVariables | undefined; subscription: Subscription } | undefined> = signal(undefined);
  private readonly pendingTasks: PendingTasks;
  private readonly _result: WritableSignal<QueryResult<TData, 'empty' | 'complete'>>;
  private readonly _enabled: WritableSignal<boolean>;

  public constructor(
    injector: Injector,
    private readonly apollo: Apollo,
    private readonly options: SignalSingleQueryOptions<TData, TVariables>
  ) {
    const { variables, lazy = false } = options;

    this.pendingTasks = injector.get(PendingTasks);

    this.variables = variables !== undefined ? linkedSignal(variables, { equal }) : signal(variables);

    this._enabled = signal(!lazy);
    this.enabled = this._enabled.asReadonly();

    this._result = signal(emptyQueryResult<TData, 'empty' | 'complete'>());
    this.result = this._result.asReadonly();

    effect(() => {
      const variables = this.variables();
      const enabled = untracked(this.enabled);

      if (!enabled) return;

      const execution = untracked(this.execution);

      if (variables !== null) {
        if (execution === undefined || execution.variables !== variables) {
          this._execute({ variables }).catch(noop);
        }
      } else if (execution !== undefined) {
        this._terminate();
      }
    }, { injector });

    injector.get(DestroyRef).onDestroy(() => this.terminate());
  }

  /**
   * Execute the query with the provided options.
   */
  public execute(execOptions: SignalQueryExecOptions<TVariables> = {}): Promise<SingleQueryResult<TData>> {
    this._enabled.set(true);
    return this._execute(execOptions);
  }

  /**
   * Terminate the query, cancelling any in-flight execution and ignoring further variable changes.
   */
  public terminate(): void {
    this._enabled.set(false);
    this._terminate();
  }

  private _execute(execOptions: SignalQueryExecOptions<TVariables> = {}): Promise<SingleQueryResult<TData>> {
    if ('variables' in execOptions) {
      this.variables.set(execOptions.variables);
    }

    const variables = untracked(this.variables);

    if (variables === null) {
      return Promise.resolve({ data: untracked(this.data) });
    }

    untracked(this.execution)?.subscription.unsubscribe();

    const { query, lazy, injector, notifyOnLoading = true, ...options } = this.options;

    const resolvePendingTask = this.pendingTasks.add();
    this.resolvePendingTask = resolvePendingTask;

    return new Promise<SingleQueryResult<TData>>(resolve => {
      const subscription = this.apollo.query<TData, TVariables>({
        ...options,
        ...execOptions,
        notifyOnLoading,
        throwError: false,
        query,
        variables
      } as QueryOptions<TData, TVariables>).pipe(
        finalize(() => resolve({ data: undefined, error: new SignalQueryCancelledError() }))
      ).subscribe(result => {
        if (!result.loading) resolve({ data: result.data, error: result.error });
        this._result.update(previous => withPreviousData(previous, result));
      });

      this.execution.set({ variables, subscription });
    }).finally(resolvePendingTask);
  }

  private _terminate(): void {
    untracked(this.execution)?.subscription.unsubscribe();
    this.execution.set(undefined);
    this.resolvePendingTask?.();
    this.resolvePendingTask = undefined;
    this._result.update(previous => withPreviousData(previous, emptyQueryResult<TData, 'empty' | 'complete'>()));
  }
}
