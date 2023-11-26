import { isPlatformBrowser } from '@angular/common';
import { Inject, NgModule, PLATFORM_ID, TransferState, makeStateKey } from '@angular/core';
import { APOLLO_MULTI_ROOT, APOLLO_OPTIONS, Apollo, ApolloOptions, ApolloOrbitModule, InMemoryCache, NormalizedCacheObject } from '@apollo-orbit/angular/core';
import { HttpLinkFactory, HttpLinkModule } from '@apollo-orbit/angular/http';
import { environment } from '../../environments/environment';

const APOLLO_STATE_KEY = makeStateKey<NormalizedCacheObject>('APOLLO_STATE');

export function apolloOptionsFactory(httpLinkFactory: HttpLinkFactory, platformId: { [key: string]: any }): ApolloOptions {
  const link = httpLinkFactory.create({ uri: environment.graphqlApiEndpoint });
  const ssrOptions = isPlatformBrowser(platformId) ? { ssrForceFetchDelay: 200 } : { ssrMode: true };
  return {
    link,
    cache: new InMemoryCache(),
    ...ssrOptions
  };
}

@NgModule({
  imports: [
    ApolloOrbitModule.forRoot(),
    HttpLinkModule
  ],
  providers: [
    { provide: APOLLO_MULTI_ROOT, useValue: true },
    { provide: APOLLO_OPTIONS, useFactory: apolloOptionsFactory, deps: [HttpLinkFactory, PLATFORM_ID] }
  ]
})
export class GraphQLModule {
  public constructor(
    private readonly apollo: Apollo,
    private readonly transferState: TransferState,
    @Inject(PLATFORM_ID) platformId: { [key: string]: any }
  ) {
    if (isPlatformBrowser(platformId)) {
      const state = this.transferState.get<NormalizedCacheObject | undefined>(APOLLO_STATE_KEY, undefined);
      if (state !== undefined) {
        this.apollo.cache.restore(state);
      }
    } else {
      this.transferState.onSerialize(APOLLO_STATE_KEY, () => this.apollo.cache.extract());
    }
  }
}
