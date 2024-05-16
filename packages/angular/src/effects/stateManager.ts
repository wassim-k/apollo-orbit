import { Injectable } from '@angular/core';
import { addStateToCache, addStateToClient, MutationManager, partition, State } from '@apollo-orbit/core';
import { ApolloClient, ApolloError } from '@apollo/client/core';
import { GraphQLError } from 'graphql';

const apolloErrorFactory = (graphQLErrors: ReadonlyArray<GraphQLError>): ApolloError => new ApolloError({ graphQLErrors });

interface Clients {
  [id: string]: {
    client: ApolloClient<any>;
    manager: MutationManager;
  } | undefined;
}

@Injectable()
export class StateManager {
  private readonly clients: Clients = {};
  private pending: ReadonlyArray<State> = [];

  /**
   * Create a mutation manager for an apollo client
   */
  public createManager(clientId: string, client: ApolloClient<any>): MutationManager {
    if (this.clients[clientId] !== undefined) throw new Error(`Apollo clients with duplicate options.id: '${clientId}'`);
    const manager = new MutationManager(apolloErrorFactory);
    this.clients[clientId] = { client, manager };
    const [current, pending] = partition(this.pending, state => state.clientId === clientId);
    this.pending = pending;
    this.addState(client, manager, ...current);
    return manager;
  }

  public onAddStates(states: Array<State>): void {
    for (const state of states) {
      const pair = this.clients[state.clientId];
      if (pair) {
        const { client, manager } = pair;
        this.addState(client, manager, state);
      } else {
        this.pending = [...this.pending, state];
      }
    }
  }

  private addState(client: ApolloClient<any>, manager: MutationManager, ...states: Array<State>): void {
    const addToClient = addStateToClient(client);
    const addToCache = addStateToCache(client.cache);
    states.forEach(state => {
      addToClient(state);
      addToCache(state);
      manager.addState(state);
      state.onInit?.(client.cache);
    });
  }
}
