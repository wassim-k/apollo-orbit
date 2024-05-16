import { isPlatformBrowser } from '@angular/common';
import { ENVIRONMENT_INITIALIZER, EnvironmentProviders, PLATFORM_ID, TransferState, inject, makeEnvironmentProviders, makeStateKey } from '@angular/core';
import { Apollo, ApolloOptions, InMemoryCache, NormalizedCacheObject, provideApolloOrbit, withApolloOptions } from '@apollo-orbit/angular/core';
import { HttpLinkFactory, withHttpLink } from '@apollo-orbit/angular/http';
import { environment } from '../../environments/environment';

const APOLLO_STATE_KEY = makeStateKey<NormalizedCacheObject>('APOLLO_STATE');

export function provideGraphQL(): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideApolloOrbit(
      withApolloOptions(apolloOptionsFactory),
      withHttpLink()
    ),
    {
      provide: ENVIRONMENT_INITIALIZER,
      multi: true,
      useFactory: () => () => {
        const apollo = inject(Apollo);
        const transferState = inject(TransferState);
        const platformId = inject(PLATFORM_ID);

        if (isPlatformBrowser(platformId)) {
          const state = transferState.get(APOLLO_STATE_KEY, undefined);
          apollo.cache.restore(state);
        } else {
          transferState.onSerialize(APOLLO_STATE_KEY, () => apollo.cache.extract());
        }
      }
    }
  ]);
}

function apolloOptionsFactory(): ApolloOptions {
  const httpLinkFactory = inject(HttpLinkFactory);
  const platformId = inject<object>(PLATFORM_ID);

  const link = httpLinkFactory.create({ uri: environment.graphqlApiEndpoint });

  const ssrOptions = isPlatformBrowser(platformId)
    ? { ssrForceFetchDelay: 200 }
    : { ssrMode: true };

  return {
    link,
    cache: new InMemoryCache(),
    ...ssrOptions
  };
}
