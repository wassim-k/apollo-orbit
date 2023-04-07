import { ApolloError, ApolloQueryResult, WatchQueryOptions as CoreWatchQueryOptions, FetchMoreQueryOptions, ObservableQuery, UpdateQueryOptions, OperationVariables as Variables } from '@apollo/client/core';
import { Observable, Subscription } from 'rxjs';
import { toQueryResult } from './result';
import { ExtraWatchQueryOptions, QueryResult, SubscribeToMoreOptions } from './types';
import { fromZenObservable } from './utils';

export class QueryObservable<TData = any, TVariables extends Variables = Variables> extends Observable<QueryResult<TData>> {
  private previousData: TData | undefined;

  public constructor(
    private readonly observableQuery: ObservableQuery<TData, TVariables>,
    { notifyOnLoading = true, throwError = false }: ExtraWatchQueryOptions
  ) {
    super(subscriber => {
      let subscription: Subscription | undefined;
      const subscribeToObservableQuery = (initial: boolean): void => {
        if (initial) {
          // on calling getCurrentResult apollo client sets lastResult based on fetchPolicy
          // when lastResult is present, apollo client emits value on subscription
          // otherwise, it is emitted here instead
          const currentResult = this.getCurrentResult();
          const lastResult = observableQuery.getLastResult();
          if (!lastResult) {
            const { previousData } = this;
            subscriber.next({ ...currentResult, previousData });
            this.previousData = currentResult.data ?? previousData;
          }
        }

        subscription = fromZenObservable(observableQuery).subscribe({
          next: () => {
            const currentResult = this.getCurrentResult();
            const { previousData } = this;
            subscriber.next({ ...currentResult, previousData });
            this.previousData = currentResult.data ?? previousData;
          },
          error: error => {
            subscription = undefined;
            if (throwError) {
              subscriber.error(error);
            } else {
              const currentResult = this.getCurrentResult();
              const { previousData } = this;
              subscriber.next({ ...currentResult, previousData });
              this.previousData = currentResult.data ?? previousData;
              const last = observableQuery['last']; // eslint-disable-line dot-notation
              observableQuery.resetLastResults();
              subscribeToObservableQuery(false);
              observableQuery['last'] = last; // eslint-disable-line dot-notation
            }
          },
          complete: () => {
            subscription = undefined;
            subscriber.complete();
          }
        });
      };

      subscribeToObservableQuery(notifyOnLoading);

      return () => subscription?.unsubscribe();
    });
  }

  public get variables(): TVariables | undefined {
    return this.observableQuery.variables;
  }

  public get options(): CoreWatchQueryOptions<TVariables> {
    return this.observableQuery.options;
  }

  public get queryId(): string {
    return this.observableQuery.queryId;
  }

  public get queryName(): string | undefined {
    return this.observableQuery.queryName;
  }

  public result(): Promise<ApolloQueryResult<TData>> {
    return this.observableQuery.result();
  }

  public getCurrentResult(): QueryResult<TData> {
    return toQueryResult(this.observableQuery.getCurrentResult());
  }

  public isDifferentFromLastResult(newResult: ApolloQueryResult<TData>): boolean | undefined {
    return this.observableQuery.isDifferentFromLastResult(newResult);
  }

  public getLastResult(): ApolloQueryResult<TData> | undefined {
    return this.observableQuery.getLastResult();
  }

  public getLastError(): ApolloError | undefined {
    return this.observableQuery.getLastError();
  }

  public resetLastResults(): void {
    return this.observableQuery.resetLastResults();
  }

  public resetQueryStoreErrors(): void {
    return this.observableQuery.resetQueryStoreErrors();
  }

  /**
   * Update the variables of this observable query, and fetch the new results.
   * This method should be preferred over `setVariables` in most use cases.
   *
   * @param variables: The new set of variables. If there are missing variables,
   * the previous values of those variables will be used.
   */
  public refetch(variables?: Partial<TVariables>): Promise<ApolloQueryResult<TData>> {
    return this.observableQuery.refetch(variables);
  }

  public fetchMore<TFetchData = TData, TFetchVars extends Variables = TVariables>(
    fetchMoreOptions:
      & FetchMoreQueryOptions<TFetchVars, TFetchData>
      & {
        updateQuery?: (previousQueryResult: TData, options: {
          fetchMoreResult: TFetchData;
          variables: TFetchVars;
        }) => TData;
      }
  ): Promise<ApolloQueryResult<TFetchData>> {
    return this.observableQuery.fetchMore(fetchMoreOptions);
  }

  public subscribeToMore<
    TSubscriptionData = TData,
    TSubscriptionVariables extends Variables = TVariables
  >(
    options: SubscribeToMoreOptions<
      TData,
      TSubscriptionVariables,
      TSubscriptionData
    >
  ): () => void {
    const { query: document, ...rest } = options;
    return this.observableQuery.subscribeToMore({ document, ...rest });
  }

  public setOptions(newOptions: Partial<CoreWatchQueryOptions<TVariables>>): Promise<ApolloQueryResult<TData>> {
    return this.observableQuery.setOptions(newOptions);
  }

  /**
   * This is for *internal* use only. Most users should instead use `refetch`
   * in order to be properly notified of results even when they come from cache.
   *
   * Update the variables of this observable query, and fetch the new results
   * if they've changed. If you want to force new results, use `refetch`.
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
   *
   * @param tryFetch: Try and fetch new results even if the variables haven't
   * changed (we may still just hit the store, but if there's nothing in there
   * this will refetch)
   */
  public setVariables(variables: TVariables): Promise<ApolloQueryResult<TData> | void> {
    return this.observableQuery.setVariables(variables);
  }

  public updateQuery<TVars extends Variables = TVariables>(
    mapFn: (
      previousQueryResult: TData,
      options: UpdateQueryOptions<TVars>,
    ) => TData
  ): void {
    return this.observableQuery.updateQuery(mapFn);
  }

  public stopPolling(): void {
    return this.observableQuery.stopPolling();
  }

  public startPolling(pollInterval: number): void {
    return this.observableQuery.startPolling(pollInterval);
  }

  /**
   * Cast this QueryObservable to an Observable.
   *
   * Useful for async pipe in order to provide better template intellisense.
   */
  public asObservable(): Observable<QueryResult<TData>> {
    return this as Observable<QueryResult<TData>>;
  }
}
