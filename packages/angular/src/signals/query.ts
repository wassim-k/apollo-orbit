import { computed, DestroyRef, effect, Injector, linkedSignal, PendingTasks, signal, Signal, untracked, WritableSignal } from '@angular/core';
import { ApolloClient, DataState, DefaultContext, DocumentNode, ErrorLike, ErrorPolicy, NetworkStatus, ObservableQuery, RefetchWritePolicy, TypedDocumentNode, UpdateQueryMapFn, OperationVariables as Variables, WatchQueryFetchPolicy } from '@apollo/client';
import { equal } from '@wry/equality';
import { noop, Subscription } from 'rxjs';
import { Apollo } from '../apollo';
import { QueryObservable } from '../queryObservable';
import type { GetData, QueryResult, SingleQueryResult, SubscribeToMoreOptions, WatchQueryOptions } from '../types';
import type { SignalVariablesOption } from './types';

export class SignalQueryExecutionError extends Error {
  public constructor(methodName: keyof SignalQuery<any, any>) {
    super(`'${methodName}' cannot be called while the query is not active.`);
    this.name = 'SignalQueryExecutionError';
  }
}

// import { ApolloClient.WatchQueryOptions as SignalQueryOptions } from  '@apollo/client';
export type SignalQueryOptions<TData = unknown, TVariables extends Variables = Variables> = {
  /**
  * Specifies how the query interacts with the Apollo Client cache during execution (for example, whether it checks the cache for results before sending a request to the server).
  *
  * For details, see [Setting a fetch policy](https://www.apollographql.com/docs/react/data/queries/#setting-a-fetch-policy).
  *
  * The default value is `cache-first`.
  *
  * @docGroup 3. Caching options
  */
  fetchPolicy?: WatchQueryFetchPolicy;
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
  initialFetchPolicy?: WatchQueryFetchPolicy;
  /**
  * Specifies whether a `NetworkStatus.refetch` operation should merge
  * incoming field data with existing data, or overwrite the existing data.
  * Overwriting is probably preferable, but merging is currently the default
  * behavior, for backwards compatibility with Apollo Client 3.x.
  *
  * @docGroup 3. Caching options
  */
  refetchWritePolicy?: RefetchWritePolicy;
  /**
  * Specifies how the query handles a response that returns both GraphQL errors and partial results.
  *
  * For details, see [GraphQL error policies](https://www.apollographql.com/docs/react/data/error-handling/#graphql-error-policies).
  *
  * The default value is `none`, meaning that the query result includes error details but not partial results.
  *
  * @docGroup 1. Operation options
  */
  errorPolicy?: ErrorPolicy;
  /**
  * If you're using [Apollo Link](https://www.apollographql.com/docs/react/api/link/introduction/), this object is the initial value of the `context` object that's passed along your link chain.
  *
  * @docGroup 2. Networking options
  */
  context?: DefaultContext;
  /**
  * Specifies the interval (in milliseconds) at which the query polls for updated results.
  *
  * The default value is `0` (no polling).
  *
  * @docGroup 2. Networking options
  */
  pollInterval?: number;
  /**
  * If `true`, the in-progress query's associated component re-renders whenever the network status changes or a network error occurs.
  *
  * The default value is `true`.
  *
  * @docGroup 2. Networking options
  */
  notifyOnNetworkStatusChange?: boolean;
  /**
  * If `true`, the query can return partial results from the cache if the cache doesn't contain results for all queried fields.
  *
  * The default value is `false`.
  *
  * @docGroup 3. Caching options
  */
  returnPartialData?: boolean;
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
  query: DocumentNode | TypedDocumentNode<TData, TVariables>;

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
} & (
    | {
      /**
       * Whether to execute query immediately or lazily via `execute` method.
       */
      lazy: true;

      /**
      * A function or signal returning an object containing all of the GraphQL variables your query requires to execute.
      *
      * Each key in the object corresponds to a variable name, and that key's value corresponds to the variable value.
      *
      * When `null` is returned, the query will be terminated until a non-null value is returned again.
      */
      variables?: () => TVariables | undefined | null;
    }
    | SignalVariablesOption<NoInfer<TVariables>>
  );

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

export class SignalQuery<TData, TVariables extends Variables = Variables, TStates extends DataState<TData>['dataState'] = 'empty' | 'complete' | 'streaming'> {
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
  public readonly active: Signal<boolean>;

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

  private observable: QueryObservable<TData, TVariables, TStates> | undefined;
  private subscription: Subscription | undefined;
  private readonly _active: WritableSignal<boolean>;
  private readonly _result: WritableSignal<QueryResult<TData, TStates>>;
  private readonly _enabled: WritableSignal<boolean>;

  public constructor(
    injector: Injector,
    private readonly apollo: Apollo,
    private readonly options: SignalQueryOptions<TData, TVariables>
  ) {
    const { variables, lazy = false } = options;

    this.variables = variables !== undefined ? linkedSignal(variables, { equal }) : signal(variables);

    this._enabled = signal(!lazy);
    this.enabled = this._enabled.asReadonly();

    this._result = signal({ data: undefined, dataState: 'empty', loading: false, networkStatus: NetworkStatus.ready } as QueryResult<TData, TStates>);
    this.result = this._result.asReadonly();

    this._active = signal(false);
    this.active = this._active.asReadonly();

    effect(() => {
      const variables = this.variables();
      const enabled = untracked(this.enabled);
      const active = untracked(this.active);

      if (!enabled) return;

      if (variables !== null) {
        if (!active) {
          this._execute({ variables }).catch(noop);
        } else {
          this.observable?.setVariables(variables as TVariables).catch(noop);
        }
      } else if (active) {
        this._terminate();
      }
    }, { injector });

    if (!lazy) {
      const pendingTasks = injector.get(PendingTasks);

      effect(() => {
        if (untracked(this.variables) !== null) {
          const resolvePendingTask = pendingTasks.add();
          this.execute().then(resolvePendingTask).catch(noop);
        }
      }, { injector });
    }

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
   * Terminate query execution and unsubscribe from the observable.
  */
  public terminate(): void {
    this._enabled.set(false);
    this._terminate();
  }

  /**
   * Refetch the query with the current variables.
   */
  public refetch(variables?: Partial<TVariables>): Promise<SingleQueryResult<TData>> {
    if (!this.observable) throw new SignalQueryExecutionError('refetch');
    return this.observable.refetch(variables)
      .catch(error => ({ data: undefined, error }));
  }

  /**
   * Fetch more data and merge it with the existing result.
   */
  public fetchMore<
    TFetchData = TData,
    TFetchVars extends Variables = TVariables
  >(options: ObservableQuery.FetchMoreOptions<TData, TVariables, TFetchData, TFetchVars>): Promise<SingleQueryResult<TFetchData>> {
    if (!this.observable) throw new SignalQueryExecutionError('fetchMore');
    return this.observable.fetchMore(options)
      .catch(error => ({ data: undefined, error }));
  }

  /**
   * Update the query's cached data.
   */
  public updateQuery(mapFn: UpdateQueryMapFn<TData, TVariables>): void {
    if (!this.observable) throw new SignalQueryExecutionError('updateQuery');
    this.observable.updateQuery(mapFn);
  }

  /**
   * Start polling the query.
   */
  public startPolling(pollInterval: number): void {
    if (!this.observable) throw new SignalQueryExecutionError('startPolling');
    this.observable.startPolling(pollInterval);
  }

  /**
   * Stop polling the query.
   */
  public stopPolling(): void {
    if (!this.observable) throw new SignalQueryExecutionError('stopPolling');
    this.observable.stopPolling();
  }

  /**
   * Subscribe to more data.
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
    if (!this.observable) throw new SignalQueryExecutionError('subscribeToMore');
    return this.observable.subscribeToMore<TSubscriptionData, TSubscriptionVariables>(options);
  }

  private _execute(execOptions: SignalQueryExecOptions<TVariables> = {}): Promise<SingleQueryResult<TData>> {
    if ('variables' in execOptions) {
      this.variables.set(execOptions.variables);
    }

    const variables = untracked(this.variables);

    if (variables === null) {
      return Promise.resolve({ data: this.data() as TData | undefined });
    }

    this._active.set(true);

    const { query, lazy, notifyOnLoading = true, notifyOnNetworkStatusChange = true, ...options } = this.options;

    const newOptions = {
      ...options,
      ...execOptions,
      notifyOnLoading,
      notifyOnNetworkStatusChange,
      query,
      variables
    } as WatchQueryOptions<TData, TVariables>;

    this.observable ??= this.apollo.watchQuery<TData, TVariables>(newOptions) as QueryObservable<TData, TVariables, any>;
    this.subscription ??= this.observable.subscribe(result => this._result.set(result));

    return this.observable.reobserve(newOptions)
      .catch(error => ({ data: undefined, error }));
  }

  private _terminate(): void {
    this._active.set(false);
    this.subscription?.unsubscribe();
    this.subscription = undefined;
    this.observable = undefined;
  }
}
