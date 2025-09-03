import { Injectable } from '@angular/core';
import { ApolloClient, NetworkStatus, OperationVariables as Variables } from '@apollo/client';
import { defer, Observable, of } from 'rxjs';
import { catchError, map, startWith } from 'rxjs/operators';
import { ApolloCacheEx, extendCache } from './cacheEx';
import { identifyFragmentType } from './gql';
import { QueryObservable } from './queryObservable';
import { ApolloSignal } from './signals';
import type { DefaultOptions, MutationOptions, MutationResult, QueryOptions, QueryResult, SubscriptionOptions, SubscriptionResult, WatchQueryOptions } from './types';

@Injectable()
export class Apollo {
  /**
   * Instance of ApolloClient
   */
  public readonly client: ApolloClient;
  public readonly cache: ApolloCacheEx;
  public readonly signal: ApolloSignal;

  private readonly defaultOptions?: DefaultOptions;

  public constructor(client: ApolloClient, defaultOptions?: DefaultOptions) {
    this.client = client;
    this.defaultOptions = defaultOptions;
    this.cache = extendCache(client.cache);
    this.signal = new ApolloSignal(this);
  }

  public query<TData = unknown, TVariables extends Variables = Variables>(
    options: QueryOptions<TData, TVariables>
  ): Observable<QueryResult<TData, 'empty' | 'complete'>> {
    const { notifyOnLoading = false, throwError = true } = { ...this.defaultOptions?.query, ...options };
    return defer(() => this.client.query<TData, TVariables>(options)).pipe(
      map(({ data, error }): QueryResult<TData, 'empty' | 'complete'> => data === undefined
        ? {
          data: undefined,
          error,
          dataState: 'empty',
          loading: false,
          networkStatus: NetworkStatus.ready
        }
        : {
          data,
          error,
          dataState: 'complete',
          loading: false,
          networkStatus: NetworkStatus.ready
        }),
      (source => notifyOnLoading
        ? source.pipe(startWith<QueryResult<TData, 'empty' | 'complete'>>({ data: undefined, dataState: 'empty', loading: true, networkStatus: NetworkStatus.loading }))
        : source),
      (source => !throwError
        ? source.pipe(catchError((error: Error) => of<QueryResult<TData, 'empty' | 'complete'>>({ error, data: undefined, dataState: 'empty', loading: false, networkStatus: NetworkStatus.error })))
        : source)
    );
  }

  public watchQuery<TData = unknown, TVariables extends Variables = Variables>(
    options: WatchQueryOptions<TData, TVariables> & { returnPartialData: true }
  ): QueryObservable<TData, TVariables, 'empty' | 'complete' | 'streaming' | 'partial'>;

  public watchQuery<TData = unknown, TVariables extends Variables = Variables>(
    options: WatchQueryOptions<TData, TVariables>
  ): QueryObservable<TData, TVariables, 'empty' | 'complete' | 'streaming'>;

  public watchQuery<TData = unknown, TVariables extends Variables = Variables>(options: WatchQueryOptions<TData, TVariables>): QueryObservable<TData, TVariables, any> {
    const { notifyOnLoading } = { ...this.defaultOptions?.watchQuery, ...options };
    return new QueryObservable(this.client.watchQuery<TData, TVariables>(options), { notifyOnLoading });
  }

  public watchFragment<
    TData = unknown,
    TVariables extends Variables = Variables
  >(options: ApolloClient.WatchFragmentOptions<TData, TVariables>): Observable<ApolloClient.WatchFragmentResult<TData>> {
    let { from, fragment, ...rest } = options;

    // Extract fragment type from the fragment document if __typename is not provided.
    if (typeof from === 'object' && 'id' in from && Object.keys(from).length === 1) {
      from = { __typename: identifyFragmentType(fragment), id: from.id };
    }

    return this.client.watchFragment({ from, fragment, ...rest });
  }

  public mutate<
    TData = unknown,
    TVariables extends Variables = Variables
  >(options: MutationOptions<TData, TVariables>): Observable<MutationResult<TData>> {
    return defer(() => this.client.mutate<TData, TVariables>(options));
  }

  public subscribe<
    TData = unknown,
    TVariables extends Variables = Variables
  >(options: SubscriptionOptions<TData, TVariables>): Observable<SubscriptionResult<TData>> {
    const { subscription: query, ...rest } = options;
    return defer(() => this.client.subscribe<TData, TVariables>({ query, ...rest } as ApolloClient.SubscribeOptions<TData, TVariables>));
  }
}
