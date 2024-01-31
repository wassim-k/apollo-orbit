import { NgModule } from '@angular/core';
import { APOLLO_OPTIONS, ApolloOptions, ApolloOrbitModule, InMemoryCache } from '@apollo-orbit/angular';
import { BatchHttpLinkFactory, BatchHttpLinkModule } from '@apollo-orbit/angular/batch-http';
import { split } from '@apollo/client/core';
import { createPersistedQueryLink } from '@apollo/client/link/persisted-queries';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { sha256 } from 'crypto-hash';
import { createClient } from 'graphql-ws';
import { AppConfig } from '../config';
import { ThemeState } from '../states/theme/theme.state';

export function apolloOptionsFactory(batchHttpLinkFactory: BatchHttpLinkFactory, appConfig: AppConfig): ApolloOptions {
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
  imports: [
    ApolloOrbitModule.forRoot([ThemeState]),
    BatchHttpLinkModule
  ],
  providers: [
    { provide: APOLLO_OPTIONS, useFactory: apolloOptionsFactory, deps: [BatchHttpLinkFactory, AppConfig] }
  ]
})
export class GraphQLModule { }
