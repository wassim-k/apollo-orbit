import { addStateToCache, addStateToClient, MutationManager, State } from '@apollo-orbit/core';
import { ApolloClient } from '@apollo/client';

interface ClientState {
  manager: MutationManager;
  added: Set<State>;
}

export class StateManager {
  private readonly clients = new WeakMap<ApolloClient, ClientState>();

  public addStates(client: ApolloClient, states: Array<State>): MutationManager {
    const { manager, added } = this.ensureClient(client);
    const addToClient = addStateToClient(client);
    const addToCache = addStateToCache(client.cache);
    for (const state of states) {
      if (added.has(state)) continue;

      added.add(state);
      manager.addState(state);
      addToClient(state);
      addToCache(state);
      state.onInit?.(client.cache);
    }
    return manager;
  }

  private ensureClient(client: ApolloClient): ClientState {
    let entry = this.clients.get(client);
    if (!entry) {
      entry = { manager: new MutationManager(), added: new Set() };
      this.clients.set(client, entry);
    }
    return entry;
  }
}
