import { Injectable } from '@angular/core';
import { ApolloClient, NetworkStatus, OperationVariables as Variables } from '@apollo/client';
import type { ApolloCache } from '@apollo/client/cache';
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

  // import { ApolloClient.watchFragment } from '@apollo/client';
  public watchFragment<TData = unknown, TVariables extends Variables = Variables>(options: ApolloClient.WatchFragmentOptions<TData, TVariables> & {
    from: Array<ApolloCache.FromOptionValue<TData>>;
  }): ApolloClient.ObservableFragment<Array<TData>>;

  public watchFragment<TData = unknown, TVariables extends Variables = Variables>(options: ApolloClient.WatchFragmentOptions<TData, TVariables> & {
    from: Array<null>;
  }): ApolloClient.ObservableFragment<Array<null>>;

  public watchFragment<TData = unknown, TVariables extends Variables = Variables>(options: ApolloClient.WatchFragmentOptions<TData, TVariables> & {
    from: Array<ApolloCache.FromOptionValue<TData> | null>;
  }): ApolloClient.ObservableFragment<Array<TData | null>>;

  public watchFragment<TData = unknown, TVariables extends Variables = Variables>(options: ApolloClient.WatchFragmentOptions<TData, TVariables> & {
    from: null;
  }): ApolloClient.ObservableFragment<null>;

  public watchFragment<TData = unknown, TVariables extends Variables = Variables>(options: ApolloClient.WatchFragmentOptions<TData, TVariables> & {
    from: ApolloCache.FromOptionValue<TData>;
  }): ApolloClient.ObservableFragment<TData>;

  public watchFragment<TData = unknown, TVariables extends Variables = Variables>(
    options: ApolloClient.WatchFragmentOptions<TData, TVariables>
  ): ApolloClient.ObservableFragment<TData | null>;

  public watchFragment<TData = unknown, TVariables extends Variables = Variables>(
    options: ApolloClient.WatchFragmentOptions<TData, TVariables>
  ): ApolloClient.ObservableFragment<any> {
    const { from, fragment, ...rest } = options;

    // Extract fragment type from the fragment document if __typename is not provided.
    const identify = (value: ApolloCache.FromOptionValue<TData> | null): ApolloCache.FromOptionValue<TData> | null =>
      typeof value === 'object' && value !== null && 'id' in value && Object.keys(value).length === 1
        ? { __typename: identifyFragmentType(fragment), id: value.id }
        : value;

    return this.client.watchFragment({
      ...rest,
      fragment,
      from: Array.isArray(from) ? from.map(identify) : identify(from)
    } as ApolloClient.WatchFragmentOptions<TData, TVariables>);
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
