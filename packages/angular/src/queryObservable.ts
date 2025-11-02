import { DataState, ObservableQuery, OperationVariables, TypedDocumentNode, UpdateQueryMapFn, OperationVariables as Variables } from '@apollo/client';
import { Observable, Subscription } from 'rxjs';
import { ExtraWatchQueryOptions, GetData, QueryResult, SingleQueryResult, SubscribeToMoreOptions, WatchQueryOptions } from './types';

export class QueryObservable<
  TData = unknown,
  TVariables extends Variables = Variables,
  TStates extends DataState<TData>['dataState'] = DataState<TData>['dataState']
> extends Observable<QueryResult<TData, TStates>> {
  private previousData: GetData<TData, TStates> | undefined;

  public constructor(
    private readonly observableQuery: ObservableQuery<TData, TVariables>,
    { notifyOnLoading = true }: ExtraWatchQueryOptions
  ) {
    super(subscriber => {
      let subscription: Subscription | undefined;

      const next = ({ partial, ...result }: ObservableQuery.Result<TData>): void => {
        const { previousData } = this;
        this.previousData = (result.data ?? previousData) as GetData<TData, TStates> | undefined;
        subscriber.next({ ...result, previousData } as QueryResult<TData, TStates>);
      };

      const complete = (): void => {
        subscription = undefined;
        subscriber.complete();
      };

      subscription = observableQuery.subscribe({
        next: notifyOnLoading ? next : skipInitialLoading(next),
        complete
      });

      return () => {
        subscription?.unsubscribe();
        subscription = undefined;
      };
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
   * Returns a `ResultPromise` with an additional `.retain()` method. Calling
   * `.retain()` keeps the network operation running even if the `ObservableQuery`
   * no longer requires the result.
   *
   * Note: `refetch()` guarantees that a value will be emitted from the
   * observable, even if the result is deep equal to the previous value.
   *
   * @param variables - The new set of variables. If there are missing variables,
   * the previous values of those variables will be used.
   */
  public refetch(variables?: Partial<TVariables>): Promise<SingleQueryResult<TData>> {
    return this.observableQuery.refetch(variables);
  }

  public fetchMore<
    TFetchData = TData,
    TFetchVars extends OperationVariables = TVariables
  >(options: ObservableQuery.FetchMoreOptions<TData, TVariables, TFetchData, TFetchVars>): Promise<SingleQueryResult<TFetchData>> {
    return this.observableQuery.fetchMore(options);
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
  public setVariables(variables: TVariables): Promise<SingleQueryResult<TData>> {
    return this.observableQuery.setVariables(variables);
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
   * Reevaluate the query, optionally against new options. New options will be
   * merged with the current options when given.
   *
   * Note: `variables` can be reset back to their defaults (typically empty) by calling `reobserve` with
   * `variables: undefined`.
   */
  public reobserve(newOptions?: Partial<WatchQueryOptions<TData, TVariables>>): Promise<SingleQueryResult<TData>> {
    return this.observableQuery.reobserve(newOptions);
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

function skipInitialLoading<TFunc extends (result: ObservableQuery.Result<any>) => void>(fn: TFunc): TFunc {
  let first = true;
  return ((result: ObservableQuery.Result<any>) => {
    const skipped = first && result.loading;
    first = false;
    if (skipped) return;
    return fn(result);
  }) as TFunc;
}
