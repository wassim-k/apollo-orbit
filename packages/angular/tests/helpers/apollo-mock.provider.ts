import { EnvironmentProviders, inject, makeEnvironmentProviders } from '@angular/core';
import { ApolloOptions, InMemoryCache, provideApollo, withApolloOptions } from '@apollo-orbit/angular';
import { ApolloLink } from '@apollo/client';
import { MockLink, MockSubscriptionLink } from '@apollo/client/testing';
import { isSubscriptionOperation } from '@apollo/client/utilities';

export function provideApolloMock(): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideApollo(
      withApolloOptions((): ApolloOptions => ({
        cache: new InMemoryCache(),
        link: ApolloLink.split(
          ({ query }) => isSubscriptionOperation(query),
          inject(MockSubscriptionLink),
          inject(MockLink)
        )
      }))
    ),
    { provide: MockLink, useFactory: () => new MockLink([], { defaultOptions: { delay: 0 } }) },
    { provide: MockSubscriptionLink, useFactory: () => new MockSubscriptionLink() }
  ]);
}
