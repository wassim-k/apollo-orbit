import { NgModule } from '@angular/core';
import { ApolloOptions, ApolloOrbitModule, APOLLO_OPTIONS, InMemoryCache } from '@apollo-orbit/angular';
import { HttpLinkFactory, HttpLinkModule } from '@apollo-orbit/angular/http';
import { split } from '@apollo/client/core';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { createClient } from 'graphql-ws';
import { AppConfig } from '../config';
import { ThemeState } from '../states/theme/theme.state';

export function apolloOptionsFactory(httpLinkFactory: HttpLinkFactory, appConfig: AppConfig, cache: InMemoryCache): ApolloOptions {
  const httpLink = httpLinkFactory.create({ uri: appConfig.graphqlApiEndpoint });
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
    httpLink
  );

  return { link, cache };
}

@NgModule({
  imports: [
    ApolloOrbitModule.forRoot([ThemeState]),
    HttpLinkModule
  ],
  providers: [
    { provide: InMemoryCache, useValue: new InMemoryCache() },
    { provide: APOLLO_OPTIONS, useFactory: apolloOptionsFactory, deps: [HttpLinkFactory, AppConfig, InMemoryCache] }
  ]
})
export class GraphQLModule { }
