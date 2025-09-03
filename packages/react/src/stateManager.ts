import { addStateToCache, addStateToClient, MutationManager, State } from '@apollo-orbit/core';
import { ApolloClient } from '@apollo/client';

export class StateManager {
  private readonly clients: Array<[ApolloClient, MutationManager]> = [];

  public addStates(client: ApolloClient, states: Array<State>): MutationManager {
    const manager = this.ensureMutationManager(client);
    const addToClient = addStateToClient(client);
    const addToCache = addStateToCache(client.cache);
    states.forEach(state => {
      manager.addState(state);
      addToClient(state);
      addToCache(state);
      state.onInit?.(client.cache);
    });
    return manager;
  }

  public ensureMutationManager(client: ApolloClient): MutationManager {
    let pair = this.clients.find(([c]) => client === c);
    if (!pair) {
      pair = [client, new MutationManager()];
      this.clients.push(pair);
    }
    return pair[1];
  }
}
