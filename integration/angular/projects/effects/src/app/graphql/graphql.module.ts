import { NgModule } from '@angular/core';
import { ApolloOptions, ApolloOrbitModule, APOLLO_OPTIONS, InMemoryCache } from '@apollo-orbit/angular';
import { HttpLinkFactory, HttpLinkModule } from '@apollo-orbit/angular/http';
import { split } from '@apollo/client/core';
import { WebSocketLink } from '@apollo/client/link/ws';
import { getMainDefinition } from '@apollo/client/utilities';
import { AppConfig } from '../config';
import { SessionState } from '../states/session/session.state';

export function apolloOptionsFactory(httpLinkFactory: HttpLinkFactory, appConfig: AppConfig, cache: InMemoryCache): ApolloOptions {
  const httpLink = httpLinkFactory.create({ uri: appConfig.graphqlApiEndpoint });
  const wsLink = new WebSocketLink({ uri: appConfig.graphqlSubscriptionEndpoint, options: { reconnect: true } });

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
    ApolloOrbitModule.forRoot([SessionState]),
    HttpLinkModule
  ],
  providers: [
    { provide: InMemoryCache, useValue: new InMemoryCache() },
    { provide: APOLLO_OPTIONS, useFactory: apolloOptionsFactory, deps: [HttpLinkFactory, AppConfig, InMemoryCache] }
  ]
})
export class GraphQLModule { }
