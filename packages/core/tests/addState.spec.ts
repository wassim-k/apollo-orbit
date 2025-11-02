import { ApolloCache, ApolloClient, ApolloLink, InMemoryCache } from '@apollo/client';
import { describe, expect, it } from 'vitest';
import { addStateToCache, addStateToClient } from '../src/addState';
import type { State } from '../src/state';

describe('addState', () => {
  it('should throw when client does not support local state', () => {
    const client = new ApolloClient({
      cache: new InMemoryCache(),
      link: new ApolloLink()
    });

    const definition: Pick<State, 'resolvers'> = {
      resolvers: [[['Query', 'test'], () => ({ test: true })]]
    };

    expect(() => addStateToClient(client)(definition))
      .toThrow('Attempted to add resolvers to ApolloClient instance that does not support local state');
  });

  it('should throw when cache does not support policies or possibleTypes', () => {
    const cache = {} as ApolloCache;

    const definition: Pick<State, 'typePolicies' | 'possibleTypes'> = {
      typePolicies: [{ User: { keyFields: ['id'] } }],
      possibleTypes: []
    };

    expect(() => addStateToCache(cache)(definition))
      .toThrow('The cache used in ApolloClient instance does not support \'typePolicies\' or \'possibleTypes\'');
  });
});
