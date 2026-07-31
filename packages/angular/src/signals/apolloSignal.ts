import { assertInInjectionContext, inject, Injector } from '@angular/core';
import { DocumentNode, TypedDocumentNode, OperationVariables as Variables } from '@apollo/client';
import { DeepPartial } from '@apollo/client/utilities';
import type { Apollo } from '../apollo';
import { SignalCacheQuery, SignalCacheQueryOptions } from './cacheQuery';
import { SignalFragment, SignalFragmentOptions } from './fragment';
import { SignalMutation, SignalMutationOptions } from './mutation';
import { SignalQuery, SignalQueryOptions } from './query';
import { SignalSingleQuery, SignalSingleQueryOptions } from './singleQuery';
import { SignalSubscription, SignalSubscriptionOptions } from './subscription';

export interface SignalQueryFn {
  <TData = unknown, TVariables extends Variables = Variables>(
    options: SignalQueryOptions<TData, TVariables> & { returnPartialData: true }
  ): SignalQuery<TData, TVariables, 'empty' | 'complete' | 'streaming' | 'partial'>;

  <TData = unknown, TVariables extends Variables = Variables>(
    options: SignalQueryOptions<TData, TVariables>
  ): SignalQuery<TData, TVariables, 'empty' | 'complete' | 'streaming'>;

  /**
   * Create a query that fetches once per execution instead of watching the cache.
   *
   * It executes initially (unless `lazy`), whenever variables change and on `execute()`. Between executions the
   * result signal keeps its last value. Cache writes and refetches elsewhere in the application never re-emit into it.
   *
   * This is the signal equivalent of `apollo.query`, whereas `signal.query` is the equivalent of `apollo.watchQuery`.
   */
  once<TData = unknown, TVariables extends Variables = Variables>(
    options: SignalSingleQueryOptions<TData, TVariables>
  ): SignalSingleQuery<TData, TVariables>;
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
    (options: SignalQueryOptions<any, any>): SignalQuery<any, any, any> => {
      const injector = this._ensureInjector(options, SignalQuery);
      return new SignalQuery(injector, this.apollo, options);
    },
    {
      once: (options: SignalSingleQueryOptions<any, any>): SignalSingleQuery<any, any> => {
        const injector = this._ensureInjector(options, SignalSingleQuery);
        return new SignalSingleQuery(injector, this.apollo, options);
      }
    }
  );

  public mutation<
    TData = unknown,
    TVariables extends Variables = Variables
  >(
    mutation: DocumentNode | TypedDocumentNode<TData, TVariables>,
    options?: SignalMutationOptions<TData, TVariables>
  ): SignalMutation<TData, TVariables> {
    return new SignalMutation<TData, TVariables>(
      this.apollo,
      mutation,
      options
    );
  }

  public subscription<
    TData = unknown,
    TVariables extends Variables = Variables
  >(options: SignalSubscriptionOptions<TData, TVariables>): SignalSubscription<TData, TVariables> {
    const injector = this._ensureInjector(options, SignalSubscription);

    return new SignalSubscription<TData, TVariables>(
      injector,
      this.apollo,
      options
    );
  }

  public fragment<
    TData = unknown,
    TVariables extends Variables = Variables
  >(options: SignalFragmentOptions<TData, TVariables>): SignalFragment<TData, TVariables> {
    const injector = this._ensureInjector(options, SignalFragment);

    return new SignalFragment<TData, TVariables>(
      injector,
      this.apollo,
      options
    );
  }

  public cacheQuery<TData = unknown, TVariables extends Variables = Variables>(
    options: SignalCacheQueryOptions<TData, TVariables> & { returnPartialData: true }
  ): SignalCacheQuery<DeepPartial<TData> | undefined, TVariables>;

  public cacheQuery<TData = unknown, TVariables extends Variables = Variables>(
    options: SignalCacheQueryOptions<TData, TVariables>
  ): SignalCacheQuery<TData, TVariables>;

  public cacheQuery<TData, TVariables extends Variables>(
    options: SignalCacheQueryOptions<TData, TVariables>
  ): SignalCacheQuery<TData, TVariables> {
    const injector = this._ensureInjector(options, SignalCacheQuery);

    return new SignalCacheQuery<TData, TVariables>(
      injector,
      this.apollo.cache,
      options
    );
  }

  /**
   * Signals must be created within an injection context unless an `injector` is provided explicitly.
   *
   * `signalType` only names the offending signal in the assertion message.
   */
  private _ensureInjector(options: { injector?: Injector }, signalType: new (...args: Array<any>) => unknown): Injector {
    if (!options.injector) {
      assertInInjectionContext(signalType);
    }

    return options.injector ?? inject(Injector);
  }
}
