import { InjectionToken } from '@angular/core';
import { ApolloClient, ApolloClientOptions, NormalizedCacheObject } from '@apollo/client/core';

export type ApolloClientFactory = (options: ApolloClientOptions<NormalizedCacheObject>) => ApolloClient<NormalizedCacheObject>;

export const APOLLO_CLIENT_FACTORY = new InjectionToken<ApolloClientFactory>('[apollo-orbit] client factory');

export const apolloClientFactory: ApolloClientFactory = (options: ApolloClientOptions<NormalizedCacheObject>): ApolloClient<NormalizedCacheObject> => {
    return new ApolloClient<NormalizedCacheObject>(options);
};
