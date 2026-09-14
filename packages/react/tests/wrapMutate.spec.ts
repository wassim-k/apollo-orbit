import { MutationManager, state } from '@apollo-orbit/core';
import { ApolloClient, ApolloLink, gql, InMemoryCache } from '@apollo/client';
import { GraphQLError } from 'graphql';
import { of } from 'rxjs';
import { wrapMutate } from '../src/wrapMutate';

describe('wrapMutate', () => {
  it.each(['none', 'all'] as const)('does not rerun a throwing effect under errorPolicy %s', async errorPolicy => {
    const mutation = gql`mutation Save { saved }`;
    const effectError = new Error('Effect failed');
    const effect = vi.fn(() => {
      throw effectError;
    });
    const manager = new MutationManager();
    manager.addState(state(descriptor => descriptor.effect(mutation, effect)));
    const client = new ApolloClient({
      cache: new InMemoryCache(),
      link: new ApolloLink(() => of({
        data: { saved: true },
        errors: errorPolicy === 'all' ? [new GraphQLError('Partial failure')] : undefined
      }))
    });

    const mutate = wrapMutate(manager, client.mutate.bind(client));
    await expect(mutate({ mutation, errorPolicy })).rejects.toBe(effectError);
    expect(effect).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ data: { saved: true } }));
    client.stop();
  });
});
