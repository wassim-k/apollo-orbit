import { computed, DestroyRef, effect, Injector, linkedSignal, signal, Signal, untracked, WritableSignal } from '@angular/core';
import { ApolloClient, DataState, DefaultContext, DocumentNode, ErrorLike, ErrorPolicy, NetworkStatus, ObservableQuery, RefetchOn, RefetchWritePolicy, TypedDocumentNode, UpdateQueryMapFn, OperationVariables as Variables, WatchQueryFetchPolicy } from '@apollo/client';
import { equal } from '@wry/equality';
import { noop } from 'rxjs';
import { Apollo } from '../apollo';
import { resultWithoutData } from '../internal/errorPolicy';
import { OperationTasks } from '../internal/operationTasks';
import { emptyQueryResult, loadingQueryResult, withPreviousData } from '../internal/queryResult';
import { QueryObservable } from '../queryObservable';
import type { GetData, QueryResult, SingleQueryResult, SubscribeToMoreOptions, WatchQueryOptions, WatchQueryResultForOptions } from '../types';
import type { SignalLazyVariablesOption } from './types';

export class SignalQueryExecutionError extends Error {
  public constructor(methodName: keyof SignalQuery<any, any>) {
    super(`'${methodName}' cannot be called while the query is not active.`);
    this.name = 'SignalQueryExecutionError';
  }
}

// import { ApolloClient.WatchQueryOptions as SignalQueryOptions } from  '@apollo/client';
export type SignalQueryOptions<TData = unknown, TVariables extends Variables = Variables, TErrorPolicy extends ErrorPolicy | undefined = ErrorPolicy, TPartial extends boolean | undefined = boolean> = {
  /**
  * Specifies how the query interacts with the Apollo Client cache during execution (for example, whether it checks the cache for results before sending a request to the server).
  *
  * For details, see [Setting a fetch policy](https://www.apollographql.com/docs/react/data/queries/#setting-a-fetch-policy).
  *
  * The default value is `cache-first`.
  *
  * @docGroup 3. Caching options
  */
  fetchPolicy?: WatchQueryFetchPolicy | (() => WatchQueryFetchPolicy);
  /**
  * Specifies the `FetchPolicy` to be used after this query has completed.
  *
  * @docGroup 3. Caching options
  */
  nextFetchPolicy?: ApolloClient.WatchQueryOptions<TData, TVariables>['nextFetchPolicy'];
  /**
  * Defaults to the initial value of options.fetchPolicy, but can be explicitly
  * configured to specify the WatchQueryFetchPolicy to revert back to whenever
  * variables change (unless nextFetchPolicy intervenes).
  *
  * @docGroup 3. Caching options
  */
  initialFetchPolicy?: WatchQueryFetchPolicy | (() => WatchQueryFetchPolicy);
  /**
  * Specifies whether a `NetworkStatus.refetch` operation should merge
  * incoming field data with existing data, or overwrite the existing data.
  * Overwriting is probably preferable, but merging is currently the default
  * behavior, for backwards compatibility with Apollo Client 3.x.
  *
  * @docGroup 3. Caching options
  */
  refetchWritePolicy?: RefetchWritePolicy | (() => RefetchWritePolicy);
  /**
  * Specifies how the query handles a response that returns both GraphQL errors and partial results.
  *
  * For details, see [GraphQL error policies](https://www.apollographql.com/docs/react/data/error-handling/#graphql-error-policies).
  *
  * The default value is `none`, meaning that the query result includes error details but not partial results.
  *
  * @docGroup 1. Operation options
  */
  errorPolicy?: TErrorPolicy;
  /**
  * If you're using [Apollo Link](https://www.apollographql.com/docs/react/api/link/introduction/), this object is the initial value of the `context` object that's passed along your link chain.
  *
  * @docGroup 2. Networking options
  */
  context?: DefaultContext | (() => DefaultContext);
  /**
  * Specifies the interval (in milliseconds) at which the query polls for updated results.
  *
  * The default value is `0` (no polling).
  *
  * @docGroup 2. Networking options
  */
  pollInterval?: number | (() => number);
  /**
  * If `true`, the in-progress query's associated component re-renders whenever the network status changes or a network error occurs.
  *
  * The default value is `true`.
  *
  * @docGroup 2. Networking options
  */
  notifyOnNetworkStatusChange?: boolean | (() => boolean);
  /**
  * If `true`, the query can return partial results from the cache if the cache doesn't contain results for all queried fields.
  *
  * The default value is `false`.
  *
  * @docGroup 3. Caching options
  */
  returnPartialData?: TPartial;
  /**
  * A callback function that's called whenever a refetch attempt occurs
  * while polling. If the function returns `true`, the refetch is
  * skipped and not reattempted until the next poll interval.
  *
  * @docGroup 2. Networking options
  */
  skipPollAttempt?: () => boolean;
  /**
  * A GraphQL query string parsed into an AST with the gql template literal.
  *
  * @docGroup 1. Operation options
  */
  query: DocumentNode | TypedDocumentNode<TData, TVariables> | (() => DocumentNode | TypedDocumentNode<TData, TVariables>);
  /**
  * Determines whether events trigger refetches for the query. Provide an
  * object mapping each refetch event to `true` (enable), `false` (disable)
  * or a callback function that returns `true`/`false` to control individual
  * events. Provide `false` to disable all automatic refetch events for this
  * query. Provide `true` to enable all automatic refetch events for this query.
  * Provide a callback function to perform additional logic to determine
  * whether to enable or disable a refetch for a query.
  *
  * `@remarks`
  * `refetchOn` inherits from `defaultOptions.watchQuery.refetchOn`. If
  * `defaultOptions.watchQuery.refetchOn` is not set, all refetch events are
  * enabled by default.
  *
  * This option only has an effect when the client is configured with a
  * `refetchEventManager`.
  * @docGroup 1. Operation options
  */
  refetchOn?: RefetchOn.Option;

  /**
   * Whether to execute query immediately or lazily via `execute` method.
   */
  lazy?: boolean;

  /**
   * Custom injector to use for this query.
   */
  injector?: Injector;
} & SignalLazyVariablesOption<NoInfer<TVariables>>;

export interface SignalQueryExecOptions<TVariables extends Variables = Variables> {
  /**
   * Variables to use for this query execution.
   */
  variables?: TVariables;

  /**
   * Context to use for this execution.
   */
  context?: DefaultContext;
}

interface Execution<TData, TVariables extends Variables, TStates extends DataState<TData>['dataState'], TErrorPolicy extends ErrorPolicy | undefined> {
  readonly observable: QueryObservable<TData, TVariables, TStates, TErrorPolicy>;
  readonly lastWatchOptions: WatchQueryOptions<TData, TVariables, TErrorPolicy>;
}

export class SignalQuery<TData, TVariables extends Variables = Variables, TStates extends DataState<TData>['dataState'] = 'empty' | 'complete' | 'streaming', TErrorPolicy extends ErrorPolicy | undefined = ErrorPolicy> {
  /**
   * The query result, containing `data`, `loading`, `error`, `networkStatus`, `previousData`, `dataState`.
   */
  public readonly result: Signal<QueryResult<TData, TStates>>;

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
  public readonly data = computed<GetData<TData, TStates> | undefined>(() => this.result().data as GetData<TData, TStates> | undefined);

  /**
   * The data from the previous successful result, useful for displaying stale data during refetches.
   */
  public readonly previousData = computed<GetData<TData, TStates> | undefined>(() => this.result().previousData);

  /**
   * An error object if the query failed, `undefined` otherwise.
   */
  public readonly error: Signal<ErrorLike | undefined> = computed(() => this.result().error);

  /**
   * A writable signal that represents the current query variables.
   */
  public readonly variables: WritableSignal<TVariables | undefined | null>;

  /**
   * Whether the query is currently active, subscribed to the underlying observable and receiving cache updates.
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
   * Note: This is different from `active`, which indicates whether the query is currently connected to its observable and actively watching the cache.
   */
  public readonly enabled: Signal<boolean>;

  private readonly execution: WritableSignal<Execution<TData, TVariables, TStates, TErrorPolicy> | undefined> = signal(undefined);
  private readonly watchOptions: Signal<WatchQueryOptions<TData, TVariables, TErrorPolicy>>;
  private readonly tasks: OperationTasks;
  private readonly _result: WritableSignal<QueryResult<TData, TStates>> = linkedSignal({
    source: computed(() => this.enabled() && this.variables() !== null),
    computation: (executable, previous) => untracked(() => {
      const fetchPolicy = this.watchOptions().fetchPolicy ??
        this.apollo.client.defaultOptions.watchQuery?.fetchPolicy;
      const loading = executable && fetchPolicy !== 'standby';
      return withPreviousData(previous?.value, loading ? loadingQueryResult<TData, TStates>() : emptyQueryResult<TData, TStates>());
    })
  });

  private readonly _enabled: WritableSignal<boolean>;

  public constructor(
    injector: Injector,
    private readonly apollo: Apollo,
    options: SignalQueryOptions<TData, TVariables, TErrorPolicy>
  ) {
    const { variables, lazy = false } = options;

    this.tasks = new OperationTasks(injector);
    this.variables = linkedSignal(() => variables?.(), { equal });
    this.watchOptions = computed(() => resolveOptions(options), { equal });

    this._enabled = signal(!lazy);
    this.enabled = this._enabled.asReadonly();

    this.result = this._result.asReadonly();

    effect(() => {
      const variables = this.variables();
      const watchOptions = this.watchOptions();

      if (!untracked(this.enabled)) return;

      if (variables === null) return this._terminate();

      const execution = untracked(this.execution);
      const options = { ...watchOptions, variables } as WatchQueryOptions<TData, TVariables, TErrorPolicy>;

      if (execution === undefined || shouldReobserve(execution.lastWatchOptions, options)) {
        this._execute({}).catch(noop);
      } else {
        this.execution.set({ ...execution, lastWatchOptions: options });
        execution.observable.applyOptions(watchOptions);
      }
    }, { injector });

    injector.get(DestroyRef).onDestroy(() => this.terminate());
  }

  /**
   * Execute the query with the provided options.
   */
  public execute(execOptions: SignalQueryExecOptions<TVariables> = {}): Promise<WatchQueryResultForOptions<TData, TErrorPolicy>> {
    this._enabled.set(true);
    return this._execute(execOptions);
  }

  /**
   * Terminate query execution and unsubscribe from the observable.
  */
  public terminate(): void {
    this._enabled.set(false);
    this._terminate();
  }

  /**
   * Refetch the query, optionally with new variables.
   *
   * Inherits the query's `errorPolicy`, so its result narrows the same way `execute` does.
   */
  public refetch(variables?: Partial<TVariables>): Promise<WatchQueryResultForOptions<TData, TErrorPolicy>> {
    const execution = this.requireExecution('refetch');
    const result = this.tasks.add(execution.observable.refetch(variables));

    if (variables !== undefined) {
      const { variables: merged } = execution.observable;
      this.execution.set({ ...execution, lastWatchOptions: { ...execution.lastWatchOptions, variables: merged } });
      this.variables.set(merged);
    }

    return result;
  }

  /**
   * Fetch more data and merge it with the existing result.
   *
   * Rejects when the fetch fails, as `ObservableQuery.fetchMore` does, and leaves the result signals alone.
   *
   * Unlike a refetch it carries its own `errorPolicy`, so its result narrows against `none` rather than the
   * ambient default.
   */
  public fetchMore<
    TFetchData = TData,
    TFetchVars extends Variables = TVariables,
    TFetchErrorPolicy extends ErrorPolicy = 'none'
  >(options: ObservableQuery.FetchMoreOptions<TData, TVariables, TFetchData, TFetchVars> & { errorPolicy?: TFetchErrorPolicy }): Promise<SingleQueryResult<TFetchData, TFetchErrorPolicy>> {
    const { observable } = this.requireExecution('fetchMore');
    return this.tasks.add(observable.fetchMore<TFetchData, TFetchVars, TFetchErrorPolicy>(options));
  }

  /**
   * Update the query's cached data.
   */
  public updateQuery(mapFn: UpdateQueryMapFn<TData, TVariables>): void {
    this.requireExecution('updateQuery').observable.updateQuery(mapFn);
  }

  /**
   * Start polling the query.
   */
  public startPolling(pollInterval: number): void {
    this.requireExecution('startPolling').observable.startPolling(pollInterval);
  }

  /**
   * Stop polling the query.
   */
  public stopPolling(): void {
    this.requireExecution('stopPolling').observable.stopPolling();
  }

  /**
   * Subscribe to more data.
   *
   * The registration belongs to the current execution. Terminating the query, or pausing it by returning
   * `null` from `variables`, drops it, and resuming registers a fresh observable with no handlers.
   */
  public subscribeToMore<
    TSubscriptionData = TData,
    TSubscriptionVariables extends Variables = TVariables
  >(
    options: SubscribeToMoreOptions<
      TData,
      TSubscriptionVariables,
      TSubscriptionData,
      TVariables
    >
  ): () => void {
    return this.requireExecution('subscribeToMore').observable.subscribeToMore<TSubscriptionData, TSubscriptionVariables>(options);
  }

  private _execute(execOptions: SignalQueryExecOptions<TVariables>): Promise<WatchQueryResultForOptions<TData, TErrorPolicy>> {
    if ('variables' in execOptions) {
      this.variables.set(execOptions.variables);
    }

    const variables = untracked(this.variables);

    if (variables === null) return this.withoutResult();

    const watchOptions = untracked(this.watchOptions);
    const options = { ...watchOptions, ...execOptions, variables } as WatchQueryOptions<TData, TVariables, TErrorPolicy>;
    let observable = untracked(this.execution)?.observable;

    if (observable === undefined) {
      observable = this.apollo.watchQuery({
        ...options,
        initialFetchPolicy: options.initialFetchPolicy ?? (options.fetchPolicy === 'standby' ? undefined : options.fetchPolicy),
        fetchPolicy: 'standby'
      }) as QueryObservable<TData, TVariables, TStates, TErrorPolicy>;

      observable.subscribe(result => this._result.update(previous => withPreviousData(previous, result)));
    }

    this.execution.set({ observable, lastWatchOptions: options });
    const fetchPolicy = observable.options.fetchPolicy === 'standby'
      ? options.fetchPolicy ?? observable.options.initialFetchPolicy
      : options.fetchPolicy;

    const previousResult = untracked(this._result);
    const result = this.tasks.add(observable.reobserve({ ...options, fetchPolicy }));

    if (untracked(this._result) === previousResult) {
      this._result.update(previous => withPreviousData(previous, observable.getCurrentResult()));
    }

    return result;
  }

  private requireExecution(method: keyof SignalQuery<any, any>): Execution<TData, TVariables, TStates, TErrorPolicy> {
    const execution = untracked(this.execution);

    if (execution === undefined) throw new SignalQueryExecutionError(method);

    return execution;
  }

  private withoutResult(): Promise<WatchQueryResultForOptions<TData, TErrorPolicy>> {
    const errorPolicy = untracked(this.watchOptions).errorPolicy ??
      this.apollo.client.defaultOptions.watchQuery?.errorPolicy;

    return resultWithoutData<TData>(errorPolicy) as Promise<WatchQueryResultForOptions<TData, TErrorPolicy>>;
  }

  private _terminate(): void {
    const execution = untracked(this.execution);

    if (execution === undefined) return;

    execution.observable.stop();
    this.execution.set(undefined);
    this.tasks.releaseAll();
    this._result.update(previous => withPreviousData(previous, emptyQueryResult<TData, TStates>()));
  }
}

function resolve<T>(option: T | (() => T)): T {
  return typeof option === 'function' ? (option as () => T)() : option;
}

function resolveOptions<TData, TVariables extends Variables, TErrorPolicy extends ErrorPolicy | undefined>(
  options: SignalQueryOptions<TData, TVariables, TErrorPolicy>
): WatchQueryOptions<TData, TVariables, TErrorPolicy> {
  const {
    variables: _variables,
    lazy: _lazy,
    injector: _injector,
    query,
    context,
    fetchPolicy,
    initialFetchPolicy,
    pollInterval,
    notifyOnNetworkStatusChange,
    refetchWritePolicy,
    ...rest
  } = options;

  return {
    ...rest,
    query: resolve(query),
    context: resolve(context),
    fetchPolicy: resolve(fetchPolicy),
    initialFetchPolicy: resolve(initialFetchPolicy),
    pollInterval: resolve(pollInterval),
    notifyOnNetworkStatusChange: resolve(notifyOnNetworkStatusChange),
    refetchWritePolicy: resolve(refetchWritePolicy)
    // Cast because `variables` are missing: they are held in their own signal and merged in at each call to Apollo.
  } as WatchQueryOptions<TData, TVariables, TErrorPolicy>;
}

function shouldReobserve<TData, TVariables extends Variables, TErrorPolicy extends ErrorPolicy | undefined>(
  previousOptions: WatchQueryOptions<TData, TVariables, TErrorPolicy>,
  options: WatchQueryOptions<TData, TVariables, TErrorPolicy>
): boolean {
  return previousOptions.query !== options.query ||
    !equal(previousOptions.variables, options.variables) ||
    (previousOptions.fetchPolicy !== options.fetchPolicy &&
      (options.fetchPolicy === 'standby' || previousOptions.fetchPolicy === 'standby'));
}
