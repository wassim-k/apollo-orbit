import { TestBed } from '@angular/core/testing';
import { APOLLO_CLIENT_FACTORY, Apollo, ApolloClient, ApolloClientFactory, InMemoryCache, NormalizedCacheObject, provideApolloOrbit, withApolloOptions } from '@apollo-orbit/angular';
import { ApolloClientOptions } from '@apollo/client/core';

class ApolloClientCustom extends ApolloClient<NormalizedCacheObject> { }

const apolloClientCustomFactory: ApolloClientFactory = (options: ApolloClientOptions<NormalizedCacheObject>): ApolloClient<NormalizedCacheObject> => {
  return new ApolloClientCustom(options);
};

describe('ApolloClientFactory', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideApolloOrbit(withApolloOptions({ cache: new InMemoryCache() })),
        { provide: APOLLO_CLIENT_FACTORY, useValue: apolloClientCustomFactory }
      ]
    });
  });

  it('should use custom client', () => {
    const apollo = TestBed.inject(Apollo);
    expect(apollo.client instanceof ApolloClientCustom).toBe(true);
  });
});
