import { NgModule, inject } from '@angular/core';
import { ApolloOptions, InMemoryCache, provideApolloOrbit, withApolloOptions } from '@apollo-orbit/angular';
import { split } from '@apollo/client/core';
import { MockLink, MockSubscriptionLink } from '@apollo/client/testing/core';
import { getMainDefinition } from '@apollo/client/utilities';

@NgModule({
  providers: [
    provideApolloOrbit(
      withApolloOptions((): ApolloOptions => ({
        cache: new InMemoryCache(),
        link: split(
          ({ query }) => {
            const definition = getMainDefinition(query);
            return (
              definition.kind === 'OperationDefinition' &&
              definition.operation === 'subscription'
            );
          },
          inject(MockSubscriptionLink),
          inject(MockLink)
        )
      }))
    ),
    { provide: MockLink, useValue: new MockLink([]) },
    { provide: MockSubscriptionLink, useValue: new MockSubscriptionLink() }
  ]
})
export class ApolloMockModule { }
