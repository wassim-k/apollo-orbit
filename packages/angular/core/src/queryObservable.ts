import { ApolloError, ApolloQueryResult, WatchQueryOptions as CoreWatchQueryOptions, FetchMoreQueryOptions, NetworkStatus, ObservableQuery, OperationVariables, TypedDocumentNode, OperationVariables as Variables } from '@apollo/client/core';
import { Concast, ObservableSubscription, Observer } from '@apollo/client/utilities';
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

  public get query(): TypedDocumentNode<TData, TVariables> {
    return this.observableQuery.query;
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

  public getCurrentResult(saveAsLastResult = true): QueryResult<TData> {
    return toQueryResult(this.observableQuery.getCurrentResult(saveAsLastResult));
  }

  // Compares newResult to the snapshot we took of this.lastResult when it was
  // first received.
  public isDifferentFromLastResult(newResult: ApolloQueryResult<TData>, variables?: TVariables): boolean | undefined {
    return this.observableQuery.isDifferentFromLastResult(newResult, variables);
  }

  public getLastResult(variablesMustMatch?: boolean): ApolloQueryResult<TData> | undefined {
    return this.observableQuery.getLastResult(variablesMustMatch);
  }

  public getLastError(variablesMustMatch?: boolean): ApolloError | undefined {
    return this.observableQuery.getLastError(variablesMustMatch);
  }

  public resetLastResults(): void {
    this.observableQuery.resetLastResults();
  }

  public resetQueryStoreErrors(): void {
    this.observableQuery.resetQueryStoreErrors();
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

  public fetchMore<
    TFetchData = TData,
    TFetchVars extends OperationVariables = TVariables,
  >(
    fetchMoreOptions:
      & FetchMoreQueryOptions<TFetchVars, TFetchData>
      & {
        updateQuery?: (
          previousQueryResult: TData,
          options: {
            fetchMoreResult: TFetchData;
            variables: TFetchVars;
          }
        ) => TData;
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

  public setOptions(newOptions: Partial<CoreWatchQueryOptions<TVariables, TData>>): Promise<ApolloQueryResult<TData>> {
    return this.observableQuery.setOptions(newOptions);
  }

  public silentSetOptions(newOptions: Partial<CoreWatchQueryOptions<TVariables, TData>>): void {
    this.observableQuery.silentSetOptions(newOptions);
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
  public setVariables(variables: TVariables): Promise<ApolloQueryResult<TData> | void> {
    return this.observableQuery.setVariables(variables);
  }

  public updateQuery<TVars extends Variables = TVariables>(
    mapFn: (
      previousQueryResult: TData,
      options: Pick<CoreWatchQueryOptions<TVars, TData>, 'variables'>
    ) => TData
  ): void {
    return this.observableQuery.updateQuery(mapFn);
  }

  public startPolling(pollInterval: number): void {
    this.observableQuery.startPolling(pollInterval);
  }

  public stopPolling(): void {
    return this.observableQuery.stopPolling();
  }

  public reobserveAsConcast(
    newOptions?: Partial<CoreWatchQueryOptions<TVariables, TData>>,
    newNetworkStatus?: NetworkStatus
  ): Concast<ApolloQueryResult<TData>> {
    return this.observableQuery.reobserveAsConcast(newOptions, newNetworkStatus);
  }

  public reobserve(
    newOptions?: Partial<CoreWatchQueryOptions<TVariables, TData>>,
    newNetworkStatus?: NetworkStatus
  ): Promise<ApolloQueryResult<TData>> {
    return this.observableQuery.reobserve(newOptions, newNetworkStatus);
  }

  public resubscribeAfterError(
    onNext: (value: ApolloQueryResult<TData>) => void,
    onError?: (error: any) => void,
    onComplete?: () => void
  ): ObservableSubscription;

  public resubscribeAfterError(
    observer: Observer<ApolloQueryResult<TData>>
  ): ObservableSubscription;

  public resubscribeAfterError(...args: [any, any?, any?]): ObservableSubscription {
    return this.observableQuery.resubscribeAfterError(...args);
  }

  public hasObservers(): boolean {
    return this.observableQuery.hasObservers();
  }
}
