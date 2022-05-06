import { addStateToCache, addStateToClient, MutationManager, StateDefinition } from '@apollo-orbit/core';
import { ApolloClient, ApolloError } from '@apollo/client';
import { GraphQLError } from 'graphql';

const apolloErrorFactory = (graphQLErrors: ReadonlyArray<GraphQLError>): ApolloError => new ApolloError({ graphQLErrors });

export class StateManager {
    private readonly clients: Array<[ApolloClient<any>, MutationManager]> = [];

    public addStates(client: ApolloClient<any>, states: Array<StateDefinition>): MutationManager {
        const manager = this.ensureMutationManager(client);
        const addToClient = addStateToClient(client);
        const addToCache = addStateToCache(client.cache);
        states.forEach(state => {
            manager.addState(state);
            addToClient(state);
            addToCache(state);
            state.onInit?.();
        });
        return manager;
    }

    private ensureMutationManager(client: ApolloClient<any>): MutationManager {
        let pair = this.clients.find(([c]) => client === c);
        if (!pair) {
            pair = [client, new MutationManager(apolloErrorFactory)];
            this.clients.push(pair);
        }
        return pair[1];
    }
}
