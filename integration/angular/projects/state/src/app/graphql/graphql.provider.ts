import { EnvironmentProviders, inject, makeEnvironmentProviders } from '@angular/core';
import { ApolloOptions, InMemoryCache, provideApollo, withApolloOptions } from '@apollo-orbit/angular';
import { BatchHttpLinkFactory, withBatchHttpLink } from '@apollo-orbit/angular/batch-http';
import { withState } from '@apollo-orbit/angular/state';
import { ApolloLink } from '@apollo/client/link';
import { PersistedQueryLink } from '@apollo/client/link/persisted-queries';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { LocalState } from '@apollo/client/local-state';
import { isSubscriptionOperation } from '@apollo/client/utilities';
import { sha256 } from 'crypto-hash';
import { createClient } from 'graphql-ws';
import { AppConfig } from '../config';
import { authorState } from '../library/states/author.state';
import { bookState } from '../library/states/book.state';
import { themeState } from '../states/theme/theme.state';

export function provideGraphQL(): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideApollo(
      withApolloOptions(apolloOptionsFactory),
      withBatchHttpLink(),
      withState(themeState, authorState, bookState)
    )
  ]);
}

function apolloOptionsFactory(): ApolloOptions {
  const appConfig = inject(AppConfig);
  const batchHttpLinkFactory = inject(BatchHttpLinkFactory);

  const batchHttpLink = batchHttpLinkFactory.create({ uri: appConfig.graphqlApiEndpoint });
  const wsLink = new GraphQLWsLink(createClient({ url: appConfig.graphqlSubscriptionEndpoint }));

  const link = ApolloLink.split(
    ({ query }) => isSubscriptionOperation(query),
    wsLink,
    new PersistedQueryLink({ sha256 }).concat(batchHttpLink)
  );

  return { link, cache: new InMemoryCache(), localState: new LocalState() };
}
