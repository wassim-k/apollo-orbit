import { DataState, ErrorLike, ErrorPolicy, ObservableQuery, TypedDocumentNode, UpdateQueryMapFn, OperationVariables as Variables } from '@apollo/client';
import { preventUnhandledRejection } from '@apollo/client/utilities/internal';
import { Observable } from 'rxjs';
import { resultWithoutData } from './internal/errorPolicy';
import { withPreviousData } from './internal/queryResult';
import { QueryResult, SingleQueryResult, SubscribeToMoreOptions, WatchQueryOptions, WatchQueryResultForOptions } from './types';

export class QueryObservable<
  TData = unknown,
  TVariables extends Variables = Variables,
  TStates extends DataState<TData>['dataState'] = DataState<TData>['dataState'],
  TErrorPolicy extends ErrorPolicy | undefined = ErrorPolicy
> extends Observable<QueryResult<TData, TStates>> {
  public constructor(
    private readonly observableQuery: ObservableQuery<TData, TVariables>
  ) {
    super(subscriber => {
      let previousResult: QueryResult<TData, TStates> | undefined;
      return observableQuery.subscribe({
        next: ({ partial, ...result }) => {
          previousResult = withPreviousData(previousResult, result as QueryResult<TData, TStates>);
          subscriber.next(previousResult);
        },
        complete: () => subscriber.complete()
      });
    });
  }

  public get query(): TypedDocumentNode<TData, TVariables> {
    return this.observableQuery.query;
  }

  public get variables(): TVariables | undefined {
    return this.observableQuery.variables;
  }

  public get options(): ObservableQuery.Options<TData, TVariables> {
    return this.observableQuery.options;
  }

  public get queryName(): string | undefined {
    return this.observableQuery.queryName;
  }

  public getCurrentResult(): QueryResult<TData, TStates> {
    const { partial, ...result } = this.observableQuery.getCurrentResult();
    return result as QueryResult<TData, TStates>;
  }

  /**
   * Update the variables of this observable query, and fetch the new results.
   * This method should be preferred over `setVariables` in most use cases.
   *
   * Note: `refetch()` guarantees that a value will be emitted from the
   * observable, even if the result is deep equal to the previous value.
   *
   * @param variables - The new set of variables. If there are missing variables,
   * the previous values of those variables will be used.
   */
  public refetch(variables?: Partial<TVariables>): Promise<WatchQueryResultForOptions<TData, TErrorPolicy>> {
    return this.settleByPolicy(this.observableQuery.refetch(variables));
  }

  public fetchMore<
    TFetchData = TData,
    TFetchVars extends Variables = TVariables,
    TFetchErrorPolicy extends ErrorPolicy = 'none'
  >(options: ObservableQuery.FetchMoreOptions<TData, TVariables, TFetchData, TFetchVars> & { errorPolicy?: TFetchErrorPolicy }): Promise<SingleQueryResult<TFetchData, TFetchErrorPolicy>> {
    return this.observableQuery.fetchMore<TFetchData, TFetchVars, TFetchErrorPolicy>(options);
  }

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
    const { subscription: document, ...rest } = options;
    return this.observableQuery.subscribeToMore<TSubscriptionData, TSubscriptionVariables>({ document, ...rest });
  }

  /**
   * Update the variables of this observable query, and fetch the new results
   * if they've changed. Most users should prefer `refetch` instead of
   * `setVariables` in order to to be properly notified of results even when
   * they come from the cache.
   *
   * Note: `setVariables()` guarantees that a value will be emitted from the
   * observable, even if the result is deeply equal to the previous value.
   *
   * Note: the promise will resolve with the last emitted result
   * when either the variables match the current variables or there
   * are no subscribers to the query.
   *
   * @param variables - The new set of variables. If there are missing variables,
   * the previous values of those variables will be used.
   */
  public setVariables(variables: TVariables): Promise<WatchQueryResultForOptions<TData, TErrorPolicy>> {
    return this.settleByPolicy(this.observableQuery.setVariables(variables));
  }

  /**
   * A function that enables you to update the query's cached result without executing a followup GraphQL operation.
   *
   * See [using updateQuery and updateFragment](https://www.apollographql.com/docs/react/caching/cache-interaction/#using-updatequery-and-updatefragment) for additional information.
   */
  public updateQuery(mapFn: UpdateQueryMapFn<TData, TVariables>): void {
    return this.observableQuery.updateQuery(mapFn);
  }

  /**
   * A function that instructs the query to begin re-executing at a specified interval (in milliseconds).
   */
  public startPolling(pollInterval: number): void {
    this.observableQuery.startPolling(pollInterval);
  }

  /**
   * A function that instructs the query to stop polling after a previous call to `startPolling`.
   */
  public stopPolling(): void {
    return this.observableQuery.stopPolling();
  }

  /**
   * @internal
   *
   * @deprecated This is an internal API and should not be used directly. This can be removed or changed at any time.
   */
  public applyOptions(newOptions: Partial<WatchQueryOptions<TData, TVariables, TErrorPolicy>>): void {
    this.observableQuery.applyOptions(newOptions);
  }

  /**
   * Reevaluate the query, optionally against new options. New options will be
   * merged with the current options when given.
   *
   * Note: `variables` can be reset back to their defaults (typically empty) by calling `reobserve` with
   * `variables: undefined`.
   */
  public reobserve(newOptions?: Partial<WatchQueryOptions<TData, TVariables, TErrorPolicy>>): Promise<WatchQueryResultForOptions<TData, TErrorPolicy>> {
    return this.settleByPolicy(this.observableQuery.reobserve(newOptions));
  }

  /**
   * A cancelled operation rejects whatever the policy says, which these narrowed results would contradict.
   * Every rejection is converted, not just `AbortError`: a failure cannot reject under `all` or `ignore`,
   * so one that does came from above Apollo's policy layer and is a cancellation.
   */
  private settleByPolicy(promise: Promise<unknown>): Promise<WatchQueryResultForOptions<TData, TErrorPolicy>> {
    const { errorPolicy } = this.observableQuery.options;

    // The `catch` makes a new promise, which loses the marking Apollo Client put on the one it returned.
    return preventUnhandledRejection(promise.catch((error: ErrorLike) =>
      resultWithoutData<TData>(errorPolicy, error)
    )) as Promise<WatchQueryResultForOptions<TData, TErrorPolicy>>;
  }

  public hasObservers(): boolean {
    return this.observableQuery.hasObservers();
  }

  /**
   * Tears down the `ObservableQuery` and stops all active operations by sending a `complete` notification.
   */
  public stop(): void {
    this.observableQuery.stop();
  }
}
