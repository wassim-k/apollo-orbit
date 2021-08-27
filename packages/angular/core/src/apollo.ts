/* eslint-disable max-len */
import { MutationManager } from '@apollo-orbit/core';
import { MutationResult, SubscriptionResult, toMutationResult, toQueryResult, toSubscriptionResult } from '@apollo-orbit/core/common';
import { ApolloCache, ApolloClient, ApolloError, MutationOptions, NetworkStatus, Observable as ZenObservable, OperationVariables as Variables, SubscriptionOptions } from '@apollo/client/core';
import { defer, Observable, of } from 'rxjs';
import { catchError, map, startWith, tap } from 'rxjs/operators';
import { QueryObservable } from './queryObservable';
import { DefaultOptions, QueryOptions, QueryResult, WatchQueryOptions } from './types';

const fromZenObservable = <T>(source: ZenObservable<T>): Observable<T> => new Observable(source.subscribe.bind(source));

export class Apollo<TCacheShape = any> {
  /**
   * Instance of ApolloClient
   */
  public readonly client: ApolloClient<TCacheShape>;

  private readonly defaultOptions?: DefaultOptions;
  private readonly manager?: MutationManager;

  public constructor(client: ApolloClient<TCacheShape>, defaultOptions?: DefaultOptions, manager?: MutationManager) {
    this.client = client;
    this.manager = manager;
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
    const { manager } = this;
    return defer(() => this.client.mutate<T, V>(
      manager?.wrapMutationOptions(options) ?? options
    )).pipe(
      map(result => toMutationResult(result)),
      (source => manager !== undefined
        ? source.pipe(tap(
          result => manager.runEffects(options, result, undefined),
          error => manager.runEffects(options, undefined, error)
        ))
        : source)
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
