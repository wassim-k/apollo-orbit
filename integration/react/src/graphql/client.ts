import { ApolloClient, ApolloLink, HttpLink, InMemoryCache } from '@apollo/client';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { LocalState } from '@apollo/client/local-state';
import { isSubscriptionOperation } from '@apollo/client/utilities';
import { createClient } from 'graphql-ws';

const wsLink = new GraphQLWsLink(createClient({ url: 'ws://localhost:4000/graphql' }));
const httpLink = new HttpLink({ uri: 'http://localhost:4000/graphql' });

const link = ApolloLink.split(
  ({ query }) => isSubscriptionOperation(query),
  wsLink,
  httpLink
);

export const cache = new InMemoryCache();
export const client = new ApolloClient({ cache, link, localState: new LocalState() });
