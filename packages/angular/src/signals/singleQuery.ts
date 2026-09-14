import { computed, DestroyRef, effect, Injector, linkedSignal, signal, Signal, untracked, WritableSignal } from '@angular/core';
import { ErrorLike, ErrorPolicy, NetworkStatus, OperationVariables as Variables } from '@apollo/client';
import { equal } from '@wry/equality';
import { noop } from 'rxjs';
import { Apollo } from '../apollo';
import { resultWithoutData } from '../internal/errorPolicy';
import { OperationTasks } from '../internal/operationTasks';
import { emptyQueryResult, loadingQueryResult, toQueryResult, withPreviousData } from '../internal/queryResult';
import { QueryObservable } from '../queryObservable';
import type { GetData, QueryOptions, QueryResult, SingleQueryResult, WatchQueryResultForOptions } from '../types';
import type { SignalQueryExecOptions } from './query';
import type { SignalLazyVariablesOption } from './types';

export type SignalSingleQueryOptions<TData = unknown, TVariables extends Variables = Variables, TErrorPolicy extends ErrorPolicy | undefined = ErrorPolicy> =
  & Omit<QueryOptions<TData, TVariables, TErrorPolicy>, 'variables'>
  & {
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

interface Execution<TData, TVariables extends Variables> {
  readonly variables: TVariables | undefined;
  readonly observable: QueryObservable<TData, TVariables, 'empty' | 'complete', ErrorPolicy>;
}

/**
 * A query that fetches once per execution instead of watching the cache.
 *
 * Executes initially (unless `lazy`), whenever variables change and on `execute()`. Between executions the result
 * signal keeps its last value. Cache writes and refetches elsewhere in the application never re-emit into it.
 */
export class SignalSingleQuery<TData, TVariables extends Variables = Variables, TErrorPolicy extends ErrorPolicy | undefined = ErrorPolicy> {
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

  private readonly execution: WritableSignal<Execution<TData, TVariables> | undefined> = signal(undefined);
  private readonly tasks: OperationTasks;
  private readonly _result: WritableSignal<QueryResult<TData, 'empty' | 'complete'>> = linkedSignal({
    source: computed(() => this.enabled() && this.variables() !== null),
    computation: (executable, previous) => untracked(() => {
      const fetchPolicy = this.options.fetchPolicy ?? this.apollo.client.defaultOptions.watchQuery?.fetchPolicy;
      const loading = executable && fetchPolicy !== 'standby';

      return withPreviousData(
        previous?.value,
        loading ? loadingQueryResult<TData, 'empty' | 'complete'>() : emptyQueryResult<TData, 'empty' | 'complete'>()
      );
    })
  });

  private readonly _enabled: WritableSignal<boolean>;

  public constructor(
    injector: Injector,
    private readonly apollo: Apollo,
    private readonly options: SignalSingleQueryOptions<TData, TVariables, TErrorPolicy>
  ) {
    const { variables, lazy = false } = options;

    this.tasks = new OperationTasks(injector);

    this.variables = linkedSignal(() => variables?.(), { equal });

    this._enabled = signal(!lazy);
    this.enabled = this._enabled.asReadonly();

    this.result = this._result.asReadonly();

    effect(() => {
      const variables = this.variables();
      const enabled = untracked(this.enabled);

      if (!enabled) return;

      if (variables === null) return this._terminate();

      const execution = untracked(this.execution);

      if (execution === undefined || execution.variables !== variables) this._execute({ variables }).catch(noop);
    }, { injector });

    injector.get(DestroyRef).onDestroy(() => this.terminate());
  }

  /**
   * Execute the query with the provided options.
   *
   * Superseding or terminating an execution aborts its request; the promise follows `errorPolicy` either way.
   */
  public execute(execOptions: SignalQueryExecOptions<TVariables> = {}): Promise<WatchQueryResultForOptions<TData, TErrorPolicy>> {
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

  private _execute(execOptions: SignalQueryExecOptions<TVariables> = {}): Promise<WatchQueryResultForOptions<TData, TErrorPolicy>> {
    if ('variables' in execOptions) {
      this.variables.set(execOptions.variables);
    }

    const variables = untracked(this.variables);

    if (variables === null) {
      return this.withoutResult();
    }

    const { query, lazy, injector, ...options } = this.options;
    const watchOptions = { ...options, ...execOptions, query, variables, returnPartialData: false };

    untracked(this.execution)?.observable.stop();

    // Never subscribe to observable, so nothing this query did not ask for can reach the result signals.
    const execution: Execution<TData, TVariables> = {
      variables,
      observable: this.apollo.watchQuery(watchOptions as never) as unknown as QueryObservable<TData, TVariables, 'empty' | 'complete', ErrorPolicy>
    };

    this.execution.set(execution);

    this._result.update(previous => withPreviousData(previous, loadingQueryResult<TData, 'empty' | 'complete'>()));

    return this.tasks.add(execution.observable.reobserve()
      .then(
        result => {
          this.setResult(execution, result);
          return result;
        },
        (error: ErrorLike) => {
          this.setResult(execution, { data: undefined, error });
          throw error;
        }
      )) as Promise<WatchQueryResultForOptions<TData, TErrorPolicy>>;
  }

  private setResult(execution: Execution<TData, TVariables>, result: SingleQueryResult<TData>): void {
    if (untracked(this.execution) !== execution) return;

    this._result.update(previous => withPreviousData(previous, toQueryResult(result)));
  }

  private withoutResult(): Promise<WatchQueryResultForOptions<TData, TErrorPolicy>> {
    const errorPolicy = this.options.errorPolicy ??
      this.apollo.client.defaultOptions.watchQuery?.errorPolicy;

    return resultWithoutData<TData>(errorPolicy) as Promise<WatchQueryResultForOptions<TData, TErrorPolicy>>;
  }

  private _terminate(): void {
    const execution = untracked(this.execution);

    if (execution === undefined) return;

    execution.observable.stop();
    this.execution.set(undefined);
    this.tasks.releaseAll();
    this._result.update(previous => withPreviousData(previous, emptyQueryResult<TData, 'empty' | 'complete'>()));
  }
}
