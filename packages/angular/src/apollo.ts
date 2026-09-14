import { Injectable } from '@angular/core';
import { ApolloClient, ErrorPolicy, OperationVariables as Variables } from '@apollo/client';
import type { ApolloCache } from '@apollo/client/cache';
import { defer, Observable } from 'rxjs';
import { ApolloCacheEx, extendCache } from './cacheEx';
import { identifyFragmentType } from './gql';
import { QueryObservable } from './queryObservable';
import { ApolloSignal } from './signals';
import type { MutationOptions, MutationResultForOptions, ObservableFragment, QueryOptions, SingleQueryResultForOptions, SubscriptionOptions, SubscriptionResult, WatchFragmentOptions, WatchQueryOptions, WatchQueryStates } from './types';

@Injectable()
export class Apollo {
  /**
   * Instance of ApolloClient
   */
  public readonly client: ApolloClient;
  public readonly cache: ApolloCacheEx;
  public readonly signal: ApolloSignal;

  public constructor(client: ApolloClient) {
    this.client = client;
    this.cache = extendCache(client.cache);
    this.signal = new ApolloSignal(this);
  }

  public query<
    TData = unknown,
    TVariables extends Variables = Variables,
    TErrorPolicy extends ErrorPolicy | undefined = undefined
  >(options: QueryOptions<TData, TVariables, TErrorPolicy>): Observable<SingleQueryResultForOptions<TData, TErrorPolicy>> {
    return defer(() => this.client.query(options as never)) as Observable<SingleQueryResultForOptions<TData, TErrorPolicy>>;
  }

  public watchQuery<
    TData = unknown,
    TVariables extends Variables = Variables,
    TErrorPolicy extends ErrorPolicy | undefined = undefined,
    TPartial extends boolean | undefined = undefined
  >(options: WatchQueryOptions<TData, TVariables, TErrorPolicy, TPartial>): QueryObservable<TData, TVariables, WatchQueryStates<TPartial>, TErrorPolicy> {
    return new QueryObservable(this.client.watchQuery<TData, TVariables>(options));
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
    options: WatchFragmentOptions<TData, TVariables>
  ): ObservableFragment<any> {
    const { from, fragment, ...rest } = options;

    // Extract fragment type from the fragment document if __typename is not provided.
    const identify = (value: unknown): unknown =>
      typeof value === 'object' && value !== null && 'id' in value && Object.keys(value).length === 1
        ? { __typename: identifyFragmentType(fragment, options.fragmentName), id: value.id }
        : value;

    return this.client.watchFragment({
      ...rest,
      fragment,
      from: Array.isArray(from) ? from.map(identify) : identify(from)
    } as WatchFragmentOptions<TData, TVariables>);
  }

  public mutate<
    TData = unknown,
    TVariables extends Variables = Variables,
    TErrorPolicy extends ErrorPolicy | undefined = undefined
  >(options: MutationOptions<TData, TVariables, TErrorPolicy>): Observable<MutationResultForOptions<TData, TErrorPolicy>> {
    return defer(() => this.client.mutate(options as never)) as Observable<MutationResultForOptions<TData, TErrorPolicy>>;
  }

  public subscribe<
    TData = unknown,
    TVariables extends Variables = Variables
  >(options: SubscriptionOptions<TData, TVariables>): Observable<SubscriptionResult<TData>> {
    const { subscription: query, ...rest } = options;
    return defer(() => this.client.subscribe<TData, TVariables>({ query, ...rest } as ApolloClient.SubscribeOptions<TData, TVariables>));
  }
}
