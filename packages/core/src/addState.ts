import { Policies } from '@apollo/client/cache/inmemory/policies';
import { ApolloCache, ApolloClient, Resolvers } from '@apollo/client/core';
import { State } from './state';

export const addStateToClient = (client: ApolloClient<any>) =>
  (definition: Pick<State, 'resolvers' | 'typeDefs'>): void => {
    client.addResolvers(definition.resolvers.reduce<Resolvers>(
      (resolvers, [[type, field], resolver]) => {
        resolvers[type] ??= {}; // eslint-disable-line @typescript-eslint/no-unnecessary-condition
        resolvers[type][field] = resolver;
        return resolvers;
      },
      {}));
  };

export const addStateToCache = (cache: ApolloCache<any>) =>
  (definition: Pick<State, 'typePolicies' | 'possibleTypes'>): void => {
    if (definition.typePolicies.length > 0 || definition.possibleTypes.length > 0) {
      const policies = getCachePolicies(cache);
      if (definition.typePolicies.length > 0) definition.typePolicies.forEach(policies.addTypePolicies.bind(policies));
      if (definition.possibleTypes.length > 0) definition.possibleTypes.forEach(policies.addPossibleTypes.bind(policies));
    }
  };

const getCachePolicies = (cache: ApolloCache<any>): Policies => {
  if ('policies' in cache) {
    return (cache as any)['policies']; // eslint-disable-line dot-notation
  } else {
    throw new Error('The cache used in ApolloClient instance does not support \'typePolicies\' or \'possibleTypes\', consider using \'InMemoryCache\'');
  }
};
