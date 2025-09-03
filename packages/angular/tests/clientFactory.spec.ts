import { TestBed } from '@angular/core/testing';
import { APOLLO_CLIENT_FACTORY, Apollo, ApolloClient, ApolloClientFactory, InMemoryCache, provideApollo, withApolloOptions } from '@apollo-orbit/angular';
import { ApolloLink } from '@apollo/client';

class ApolloClientCustom extends ApolloClient { }

const apolloClientCustomFactory: ApolloClientFactory = (options: ApolloClient.Options): ApolloClient => {
  return new ApolloClientCustom(options);
};

describe('ApolloClientFactory', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideApollo(withApolloOptions({ cache: new InMemoryCache(), link: ApolloLink.empty() })),
        { provide: APOLLO_CLIENT_FACTORY, useValue: apolloClientCustomFactory }
      ]
    });
  });

  it('should use custom client', () => {
    const apollo = TestBed.inject(Apollo);
    expect(apollo.client instanceof ApolloClientCustom).toBe(true);
  });
});
