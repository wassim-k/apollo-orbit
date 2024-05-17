/* eslint-disable max-len */
import { Injectable } from '@angular/core';
import { ApolloClient, ApolloError, MutationOptions, NetworkStatus, SubscriptionOptions, OperationVariables as Variables, WatchFragmentOptions, WatchFragmentResult } from '@apollo/client/core';
import { Observable, defer, of } from 'rxjs';
import { catchError, map, startWith } from 'rxjs/operators';
import { ApolloCacheEx, extendCache } from './cacheEx';
import { QueryObservable } from './queryObservable';
import { toMutationResult, toQueryResult, toSubscriptionResult } from './result';
import type { DefaultOptions, MutationResult, QueryOptions, QueryResult, SubscriptionResult, WatchQueryOptions } from './types';
import { fromZenObservable } from './utils';

@Injectable()
export class Apollo<TCacheShape = any> {
  /**
   * Instance of ApolloClient
   */
  public readonly client: ApolloClient<TCacheShape>;

  private readonly defaultOptions?: DefaultOptions;
  private readonly _cache: ApolloCacheEx<TCacheShape>;

  public constructor(client: ApolloClient<TCacheShape>, defaultOptions?: DefaultOptions) {
    this.client = client;
    this.defaultOptions = defaultOptions;
    this._cache = extendCache<TCacheShape>(client.cache);
  }

  public query<T = any, V extends Variables = Variables>(options: QueryOptions<V, T>): Observable<QueryResult<T>> {
    const { notifyOnLoading = false, throwError = true } = { ...this.defaultOptions?.query, ...options };
    return defer(() => this.client.query<T, V>(options)).pipe(
      map(result => toQueryResult(result)),
      (source => notifyOnLoading
        ? source.pipe(startWith<QueryResult<T>>({ loading: true, networkStatus: NetworkStatus.loading }))
        : source),
      (source => !throwError
        ? source.pipe(catchError((error: ApolloError) => of<QueryResult<T>>({ error, loading: false, networkStatus: NetworkStatus.error })))
        : source)
    );
  }

  public watchQuery<T = any, V extends Variables = Variables>(options: WatchQueryOptions<V, T>): QueryObservable<T, V> {
    const { notifyOnLoading, throwError } = { ...this.defaultOptions?.watchQuery, ...options };
    return new QueryObservable(this.client.watchQuery<T, V>(options), { notifyOnLoading, throwError });
  }

  public watchFragment<T = any, V extends Variables = Variables>(options: WatchFragmentOptions<T, V>): Observable<WatchFragmentResult<T>> {
    return fromZenObservable(this.cache.watchFragment(options));
  }

  public mutate<T = any, V extends Variables = Variables>(options: MutationOptions<T, V>): Observable<MutationResult<T>> {
    return defer(() => this.client.mutate<T, V>(options)).pipe(
      map(result => toMutationResult(result))
    );
  }

  public subscribe<T = any, V extends Variables = Variables>(options: SubscriptionOptions<V, T>): Observable<SubscriptionResult<T>> {
    return defer(() => fromZenObservable(this.client.subscribe<T, V>(options))).pipe(
      map(result => toSubscriptionResult(result))
    );
  }

  public get cache(): ApolloCacheEx<TCacheShape> {
    return this._cache;
  }
}
