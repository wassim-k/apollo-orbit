import { Policies } from '@apollo/client/cache/inmemory/policies';
import { ApolloCache, ApolloClient, Resolvers } from '@apollo/client/core';
import { StateDefinition } from './state';
import { TransformResolver } from './types';

export const addStateToClient = (
  client: ApolloClient<any>,
  options?: {
    transformResolver?: TransformResolver;
  }
) =>
  (definition: Pick<StateDefinition, 'resolvers' | 'typeDefs'>): void => {
    const transform = options?.transformResolver ?? (fn => fn);
    client.addResolvers(definition.resolvers.reduce<Resolvers>(
      (resolvers, [[type, field], resolver]) => {
        resolvers[type] ??= {};
        resolvers[type][field] = transform(resolver);
        return resolvers;
      },
      {}));

    // Disabled because of issue and lack of support for lazily adding typeDefs
    // https://github.com/apollographql/apollo-client-devtools/issues/239
    // if (definition.typeDefs !== undefined) {
    //   const typeDefs = client.typeDefs !== undefined ? Array.isArray(client.typeDefs) ? client.typeDefs : [client.typeDefs] : [];
    //   typeDefs.push(...definition.typeDefs);
    //   (client as any).typeDefs = typeDefs;
    // }
  };

export const addStateToCache = (cache: ApolloCache<any>) =>
  (definition: Pick<StateDefinition, 'typePolicies' | 'possibleTypes'>): void => {
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
