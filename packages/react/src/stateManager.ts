import { addStateToCache, addStateToClient, createSymbol, MutationManager, StateDefinition } from '@apollo-orbit/core';
import { ApolloClient } from '@apollo/client/core';

const instantiatedSymbol: symbol = createSymbol('instantiated');

export class StateManager {
    private readonly clients: Array<[ApolloClient<any>, MutationManager]> = [];

    public addStates(client: ApolloClient<any>, states: Array<StateDefinition>): MutationManager {
        const manager = this.ensureMutationManager(client);
        const addToClient = addStateToClient(client);
        const addToCache = addStateToCache(client.cache);
        this.filterStateDefinitions(states)
            .forEach(state => {
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
            pair = [client, new MutationManager()];
            this.clients.push(pair);
        }
        return pair[1];
    }

    private filterStateDefinitions(states: Array<StateDefinition>): Array<StateDefinition> {
        return states
            .filter(state => !Object.prototype.hasOwnProperty.call(state, instantiatedSymbol))
            .map(state => {
                // This is necessary to avoid issues with duplicate calls to useMemo in React's StrictMode
                Object.defineProperty(state, instantiatedSymbol, {});
                return state;
            });
    }
}
