import { assertInInjectionContext, inject, Injector } from '@angular/core';
import { DocumentNode, TypedDocumentNode, OperationVariables as Variables } from '@apollo/client';
import { DeepPartial } from '@apollo/client/utilities';
import type { Apollo } from '../apollo';
import { SignalCacheQuery, SignalCacheQueryOptions } from './cacheQuery';
import { SignalFragment, SignalFragmentOptions } from './fragment';
import { SignalMutation, SignalMutationOptions } from './mutation';
import { SignalQuery, SignalQueryOptions } from './query';
import { SignalSubscription, SignalSubscriptionOptions } from './subscription';

export class ApolloSignal {
  public constructor(
    private readonly apollo: Apollo
  ) { }

  public query<
    TData = unknown,
    TVariables extends Variables = Variables
  >(
    options: SignalQueryOptions<TData, TVariables> & { returnPartialData: true }
  ): SignalQuery<TData, TVariables, 'empty' | 'complete' | 'streaming' | 'partial'>;

  public query<
    TData = unknown,
    TVariables extends Variables = Variables
  >(
    options: SignalQueryOptions<TData, TVariables>
  ): SignalQuery<TData, TVariables, 'empty' | 'complete' | 'streaming'>;

  public query<
    TData = unknown,
    TVariables extends Variables = Variables
  >(options: SignalQueryOptions<TData, TVariables>): SignalQuery<TData, TVariables, any> {
    if (!options.injector) {
      assertInInjectionContext(this.query.bind(this));
    }

    const injector = options.injector ?? inject(Injector);

    return new SignalQuery<TData, TVariables>(
      injector,
      this.apollo,
      options
    );
  }

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
    if (!options.injector) {
      assertInInjectionContext(this.subscription.bind(this));
    }

    const injector = options.injector ?? inject(Injector);

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
    if (!options.injector) {
      assertInInjectionContext(this.fragment.bind(this));
    }

    const injector = options.injector ?? inject(Injector);

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
    if (!options.injector) {
      assertInInjectionContext(this.cacheQuery.bind(this));
    }

    const injector = options.injector ?? inject(Injector);

    return new SignalCacheQuery<TData, TVariables>(
      injector,
      this.apollo.cache,
      options
    );
  }
}
