import type { ApolloCache, ApolloClient } from '@apollo/client';
import { Policies } from '@apollo/client/cache';
import type { LocalState } from '@apollo/client/local-state';
import type { State } from './state';

export const addStateToClient = (client: ApolloClient) =>
  (definition: Pick<State, 'resolvers'>): void => {
    const resolvers = definition.resolvers.reduce<LocalState.Resolvers>(
      (resolvers, [[type, field], resolver]) => {
        resolvers[type] ??= {};
        resolvers[type][field] = resolver;
        return resolvers;
      },
      {});

    if (Object.keys(resolvers).length > 0) {
      if (client.localState === undefined) {
        throw new Error('Attempted to add resolvers to ApolloClient instance that does not support local state. Consider setting `localState` option.');
      }

      client.localState.addResolvers(resolvers);
    }
  };

export const addStateToCache = (cache: ApolloCache) =>
  (definition: Pick<State, 'typePolicies' | 'possibleTypes'>): void => {
    if (definition.typePolicies.length > 0 || definition.possibleTypes.length > 0) {
      const policies = getCachePolicies(cache);
      if (definition.typePolicies.length > 0) definition.typePolicies.forEach(policies.addTypePolicies.bind(policies));
      if (definition.possibleTypes.length > 0) definition.possibleTypes.forEach(policies.addPossibleTypes.bind(policies));
    }
  };

const getCachePolicies = (cache: ApolloCache): Policies => {
  if ('policies' in cache) {
    return (cache as any)['policies']; // eslint-disable-line dot-notation
  } else {
    throw new Error('The cache used in ApolloClient instance does not support \'typePolicies\' or \'possibleTypes\'. Consider using \'InMemoryCache\'');
  }
};
