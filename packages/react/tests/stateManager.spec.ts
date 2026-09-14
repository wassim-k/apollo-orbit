import { state } from '@apollo-orbit/core';
import { ApolloClient, ApolloLink, gql, InMemoryCache } from '@apollo/client';
import { StateManager } from '../src/stateManager';

describe('StateManager', () => {
  const mutation = gql`mutation UpdateValue { updateValue }`;
  const createClient = (): ApolloClient => new ApolloClient({ cache: new InMemoryCache(), link: ApolloLink.empty() });

  it('should initialize and register a repeated state once per client', () => {
    const manager = new StateManager();
    const client = createClient();
    const initialize = vi.fn();
    const effect = vi.fn();
    const definition = state(descriptor => descriptor.onInit(initialize).effect(mutation, effect));

    const mutations = manager.addStates(client, [definition, definition]);
    expect(manager.addStates(client, [definition])).toBe(mutations);
    mutations.runEffects({ mutation }, undefined, undefined);

    expect(initialize).toHaveBeenCalledExactlyOnceWith(client.cache);
    expect(effect).toHaveBeenCalledOnce();
    client.stop();
  });

  it('should register the same state independently for different clients', () => {
    const manager = new StateManager();
    const first = createClient();
    const second = createClient();
    const initialize = vi.fn();
    const effect = vi.fn();
    const definition = state(descriptor => descriptor.onInit(initialize).effect(mutation, effect));

    const firstMutations = manager.addStates(first, [definition]);
    const secondMutations = manager.addStates(second, [definition]);
    firstMutations.runEffects({ mutation }, undefined, undefined);
    secondMutations.runEffects({ mutation }, undefined, undefined);

    expect(firstMutations).not.toBe(secondMutations);
    expect(initialize.mock.calls).toEqual([[first.cache], [second.cache]]);
    expect(effect).toHaveBeenCalledTimes(2);
    first.stop();
    second.stop();
  });
});
