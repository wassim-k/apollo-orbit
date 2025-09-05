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
   * Note: the `next` callback will *not* fire if the variables have not changed
   * or if the result is coming from cache.
   *
   * Note: the promise will return the old results immediately if the variables
   * have not changed.
   *
   * Note: the promise will return null immediately if the query is not active
   * (there are no subscribers).
   *
   * @private
   *
   * @param variables: The new set of variables. If there are missing variables,
   * the previous values of those variables will be used.
   */
  public setVariables(variables: TVariables): Promise<SingleQueryResult<TData>> {
    return this.observableQuery.setVariables(variables);
  }

  public updateQuery(mapFn: UpdateQueryMapFn<TData, TVariables>): void {
    return this.observableQuery.updateQuery(mapFn);
  }

  public startPolling(pollInterval: number): void {
    this.observableQuery.startPolling(pollInterval);
  }

  public stopPolling(): void {
    return this.observableQuery.stopPolling();
  }

  /**
    * Reevaluate the query, optionally against new options. New options will be
    * merged with the current options when given.
    */
  public reobserve(newOptions?: Partial<WatchQueryOptions<TData, TVariables>>): Promise<SingleQueryResult<TData>> {
    return this.observableQuery.reobserve(newOptions);
  }

  public hasObservers(): boolean {
    return this.observableQuery.hasObservers();
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
