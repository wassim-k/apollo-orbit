import { assertInInjectionContext, inject, Injector } from '@angular/core';
import { ErrorPolicy, TypedDocumentNode, OperationVariables as Variables } from '@apollo/client';
import type { ApolloCache } from '@apollo/client/cache';
import type { Apollo } from '../apollo';
import type { WatchQueryStates } from '../types';
import { SignalCacheQuery, SignalCacheQueryOptions } from './cacheQuery';
import { FragmentFrom, SignalFragment, SignalFragmentOptions } from './fragment';
import { SignalMutation, SignalMutationOptions } from './mutation';
import { SignalQuery, SignalQueryOptions } from './query';
import { SignalSingleQuery, SignalSingleQueryOptions } from './singleQuery';
import { SignalSubscription, SignalSubscriptionOptions } from './subscription';

export interface SignalQueryFn {
  <
    TData = unknown,
    TVariables extends Variables = Variables,
    TErrorPolicy extends ErrorPolicy | undefined = undefined,
    TPartial extends boolean | undefined = undefined
  >(
    options: SignalQueryOptions<TData, TVariables, TErrorPolicy, TPartial>
  ): SignalQuery<TData, TVariables, WatchQueryStates<TPartial>, TErrorPolicy>;

  once<
    TData = unknown,
    TVariables extends Variables = Variables,
    TErrorPolicy extends ErrorPolicy | undefined = undefined
  >(
    options: SignalSingleQueryOptions<TData, TVariables, TErrorPolicy>
  ): SignalSingleQuery<TData, TVariables, TErrorPolicy>;
}

export interface SignalCacheQueryFn {
  /**
   * Create a signal that reads a query from the cache and watches it for updates.
   * Narrow the result on `complete` to reach fully typed `data`.
   *
   * Use `cacheQuery.required` for a query whose data is always available in the cache.
   */
  <TData = unknown, TVariables extends Variables = Variables, TPartial extends boolean = false>(
    options: SignalCacheQueryOptions<TData, TVariables, TPartial>
  ): SignalCacheQuery<TData, TVariables, TPartial>;

  /**
   * Create a signal for a query whose data is always available in the cache. `data()` is fully typed
   * and needs no narrowing.
   *
   * Reading an incomplete result throws, rather than handing back `null` behind a `TData`.
   */
  required<TData = unknown, TVariables extends Variables = Variables>(
    options: Omit<SignalCacheQueryOptions<TData, TVariables, false>, 'returnPartialData'>
  ): SignalCacheQuery<TData, TVariables, false, true>;
}

export class ApolloSignal {
  public constructor(
    private readonly apollo: Apollo
  ) { }

  /**
   * Create a reactive signal-based query that watches the cache for updates.
   *
   * Use `query.once` for a query that fetches once per execution instead.
   */
  public readonly query: SignalQueryFn = Object.assign(
    (options: any): SignalQuery<any, any, any, any> => {
      const injector = this.ensureInjector(options, SignalQuery);
      return new SignalQuery(injector, this.apollo, options);
    },
    {
      once: (options: SignalSingleQueryOptions<any, any, any>): SignalSingleQuery<any, any, any> => {
        const injector = this.ensureInjector(options, SignalSingleQuery);
        return new SignalSingleQuery(injector, this.apollo, options);
      }
    }
  );

  public mutation<
    TData = unknown,
    TVariables extends Variables = Variables,
    TErrorPolicy extends ErrorPolicy | undefined = undefined
  >(
    mutation: TypedDocumentNode<TData, TVariables>,
    options?: SignalMutationOptions<TData, TVariables, TErrorPolicy>
  ): SignalMutation<TData, TVariables, TErrorPolicy> {
    return new SignalMutation<TData, TVariables, TErrorPolicy>(
      this.apollo,
      mutation,
      options
    );
  }

  public subscription<
    TData = unknown,
    TVariables extends Variables = Variables
  >(options: SignalSubscriptionOptions<TData, TVariables>): SignalSubscription<TData, TVariables> {
    const injector = this.ensureInjector(options, SignalSubscription);

    return new SignalSubscription<TData, TVariables>(
      injector,
      this.apollo,
      options
    );
  }

  // import { ApolloClient.watchFragment as fragment } from '@apollo/client';
  public fragment<TData = unknown, TVariables extends Variables = Variables>(
    options: SignalFragmentOptions<TData, TVariables, Array<ApolloCache.FromOptionValue<TData>>>
  ): SignalFragment<Array<TData>, TVariables>;

  public fragment<TData = unknown, TVariables extends Variables = Variables>(
    options: SignalFragmentOptions<TData, TVariables, Array<null>>
  ): SignalFragment<Array<null>, TVariables>;

  public fragment<TData = unknown, TVariables extends Variables = Variables>(
    options: SignalFragmentOptions<TData, TVariables, Array<ApolloCache.FromOptionValue<TData> | null>>
  ): SignalFragment<Array<TData | null>, TVariables>;

  public fragment<TData = unknown, TVariables extends Variables = Variables>(
    options: SignalFragmentOptions<TData, TVariables, null>
  ): SignalFragment<null, TVariables>;

  public fragment<TData = unknown, TVariables extends Variables = Variables>(
    options: SignalFragmentOptions<TData, TVariables, ApolloCache.FromOptionValue<TData>>
  ): SignalFragment<TData, TVariables>;

  public fragment<TData = unknown, TVariables extends Variables = Variables>(
    options: SignalFragmentOptions<TData, TVariables>
  ): SignalFragment<TData | null, TVariables>;

  public fragment<TData = unknown, TVariables extends Variables = Variables>(
    options: SignalFragmentOptions<TData, TVariables, FragmentFrom<TData>>
  ): SignalFragment<TData, TVariables> {
    const injector = this.ensureInjector(options, SignalFragment);

    return new SignalFragment<TData, TVariables>(
      injector,
      this.apollo,
      options
    );
  }

  public readonly cacheQuery: SignalCacheQueryFn = Object.assign(
    (options: any): SignalCacheQuery<any, any, any, any> => {
      const injector = this.ensureInjector(options, SignalCacheQuery);
      return new SignalCacheQuery(injector, this.apollo.cache, options);
    },
    {
      required: (options: SignalCacheQueryOptions<any, any, any>): SignalCacheQuery<any, any, any, any> => {
        const injector = this.ensureInjector(options, SignalCacheQuery);
        return new SignalCacheQuery(injector, this.apollo.cache, options, true);
      }
    }
  );

  /**
   * Signals must be created within an injection context unless an `injector` is provided explicitly.
   *
   * `signalType` only names the offending signal in the assertion message.
   */
  private ensureInjector(options: { injector?: Injector }, signalType: new (...args: Array<any>) => unknown): Injector {
    if (!options.injector) {
      assertInInjectionContext(signalType);
    }

    return options.injector ?? inject(Injector);
  }
}
