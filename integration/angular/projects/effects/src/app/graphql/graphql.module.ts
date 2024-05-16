import { NgModule, inject } from '@angular/core';
import { ApolloOptions, InMemoryCache, provideApolloOrbit, withApolloOptions, withStates } from '@apollo-orbit/angular';
import { BatchHttpLinkFactory, withBatchHttpLink } from '@apollo-orbit/angular/batch-http';
import { split } from '@apollo/client/core';
import { createPersistedQueryLink } from '@apollo/client/link/persisted-queries';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { sha256 } from 'crypto-hash';
import { createClient } from 'graphql-ws';
import { AppConfig } from '../config';
import { themeState } from '../states/theme/theme.state';

export function apolloOptionsFactory(): ApolloOptions {
  const appConfig = inject(AppConfig);
  const batchHttpLinkFactory = inject(BatchHttpLinkFactory);

  const batchHttpLink = batchHttpLinkFactory.create({ uri: appConfig.graphqlApiEndpoint });
  const wsLink = new GraphQLWsLink(createClient({ url: appConfig.graphqlSubscriptionEndpoint }));

  const link = split(
    ({ query }) => {
      const definition = getMainDefinition(query);
      return (
        definition.kind === 'OperationDefinition' &&
        definition.operation === 'subscription'
      );
    },
    wsLink,
    createPersistedQueryLink({ sha256 }).concat(batchHttpLink)
  );

  return { link, cache: new InMemoryCache() };
}

@NgModule({
  providers: [
    provideApolloOrbit(
      withApolloOptions(apolloOptionsFactory),
      withStates(themeState),
      withBatchHttpLink()
    )
  ]
})
export class GraphQLModule { }
