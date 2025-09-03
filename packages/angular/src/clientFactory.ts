import { inject, InjectionToken, NgZone } from '@angular/core';
import { ApolloClient } from '@apollo/client';

export type ApolloClientFactory = (options: ApolloClient.Options) => ApolloClient;

export const APOLLO_CLIENT_FACTORY = new InjectionToken<ApolloClientFactory>('[apollo-orbit] client factory');

export const apolloClientFactory: ApolloClientFactory = (options: ApolloClient.Options): ApolloClient => {
  const ngZone = inject(NgZone);
  return ngZone.runOutsideAngular(() => new ApolloClient(options));
};
