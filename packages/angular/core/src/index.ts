export { ApolloCache, ApolloClient, ApolloError, ApolloQueryResult, Cache, DataProxy, DocumentNode, FetchMoreOptions, FetchMoreQueryOptions, InMemoryCache, MutationOptions, NetworkStatus, NormalizedCache, NormalizedCacheObject, StoreObject, SubscriptionOptions, TypedDocumentNode, UpdateQueryOptions, OperationVariables as Variables, gql } from '@apollo/client/core';
export { Apollo } from './apollo';
export { APOLLO_CLIENT_FACTORY, ApolloClientFactory } from './clientFactory';
export { ApolloInstanceFactory as ɵApolloInstanceFactory } from './instanceFactory';
export { mapMutation, mapQuery, mapSubscription } from './map';
export { ApolloOrbitFeature, provideApolloInstance, provideApolloOrbit, withApolloOptions } from './providers';
export { QueryObservable } from './queryObservable';
export { APOLLO_MULTI_ROOT, APOLLO_INSTANCE_FACTORY as ɵAPOLLO_INSTANCE_FACTORY } from './tokens';
export * from './types';
