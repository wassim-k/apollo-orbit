/* eslint-disable max-len */
import { ApolloCache, ApolloClient, ApolloError, MutationOptions, NetworkStatus, OperationVariables as Variables, SubscriptionOptions } from '@apollo/client/core';
import { defer, Observable, of } from 'rxjs';
import { catchError, map, startWith } from 'rxjs/operators';
import { QueryObservable } from './queryObservable';
import { toMutationResult, toQueryResult, toSubscriptionResult } from './result';
import { DefaultOptions, MutationResult, QueryOptions, QueryResult, SubscriptionResult, WatchQueryOptions } from './types';
import { fromZenObservable } from './utils';

export class Apollo<TCacheShape = any> {
  /**
   * Instance of ApolloClient
   */
  public readonly client: ApolloClient<TCacheShape>;

  private readonly defaultOptions?: DefaultOptions;

  public constructor(client: ApolloClient<TCacheShape>, defaultOptions?: DefaultOptions) {
    this.client = client;
    this.defaultOptions = defaultOptions;
  }

  public query<T = any, V = Variables>(options: QueryOptions<V, T>): Observable<QueryResult<T>> {
    const { emitInitial = false, throwError = true } = { ...this.defaultOptions?.query, ...options };
    return defer(() => this.client.query<T, V>(options)).pipe(
      map(result => toQueryResult(result)),
      (source => emitInitial
        ? source.pipe(startWith<QueryResult<T>>({ loading: true, networkStatus: NetworkStatus.loading }))
        : source),
      (source => !throwError
        ? source.pipe(catchError((error: ApolloError) => of<QueryResult<T>>({ error, loading: false, networkStatus: NetworkStatus.error })))
        : source)
    );
  }

  public watchQuery<T = any, V = Variables>(options: WatchQueryOptions<V, T>): QueryObservable<T, V> {
    const { emitInitial, throwError } = { ...this.defaultOptions?.watchQuery, ...options };
    return new QueryObservable(this.client.watchQuery<T, V>(options), { emitInitial, throwError });
  }

  public mutate<T = any, V = Variables>(options: MutationOptions<T, V>): Observable<MutationResult<T>> {
    return defer(() => this.client.mutate<T, V>(options)).pipe(
      map(result => toMutationResult(result))
    );
  }

  public subscribe<T = any, V = Variables>(options: SubscriptionOptions<V, T>): Observable<SubscriptionResult<T>> {
    return fromZenObservable(this.client.subscribe<T, V>(options)).pipe(
      map(result => toSubscriptionResult(result))
    );
  }

  public get cache(): ApolloCache<TCacheShape> {
    return this.client.cache;
  }
}
