import { ENVIRONMENT_INITIALIZER, EnvironmentProviders, Provider, inject, makeEnvironmentProviders } from '@angular/core';
import { ɵAPOLLO_INSTANCE_FACTORY as APOLLO_INSTANCE_FACTORY, Apollo as ApolloBase, ApolloClient, ɵApolloInstanceFactory as ApolloInstanceFactory, ApolloOrbitFeature, DefaultOptions, provideApolloOrbit as provideApolloOrbitCore } from '@apollo-orbit/angular/core';
import { State } from '@apollo-orbit/core';
import { Apollo } from './apollo';
import { StateManager } from './stateManager';
import { StateFactory } from './types';

export function withStates(...states: Array<State | StateFactory>): ApolloOrbitFeature {
  return {
    kind: 'APOLLO_ORBIT_STATES',
    providers: getStatesProviders(states)
  };
}

export function provideApolloOrbit(...features: Array<ApolloOrbitFeature>): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideApolloOrbitCore(...features),
    StateManager,
    { provide: Apollo, useExisting: ApolloBase }, // in case Apollo is accidentally imported from core entry point
    { provide: APOLLO_INSTANCE_FACTORY, useFactory: apolloInstanceFactory, deps: [StateManager] }
  ]);
}

export function provideStates(...states: Array<State | StateFactory>): EnvironmentProviders {
  return makeEnvironmentProviders(getStatesProviders(states));
}

function getStatesProviders(states: Array<State | StateFactory>): Array<Provider> {
  return [
    { provide: ENVIRONMENT_INITIALIZER, multi: true, useFactory: () => () => addStates(states) }
  ];
}

function apolloInstanceFactory(stateManager: StateManager): ApolloInstanceFactory {
  return (clientId: string, client: ApolloClient<any>, defaultOptions?: DefaultOptions): Apollo => {
    const manager = stateManager.createManager(clientId, client);
    return new Apollo(client, manager, defaultOptions);
  };
}

function addStates(states: Array<State | StateFactory>): void {
  inject(StateManager).onAddStates(states.map(state => typeof state === 'function' ? state() : state));
}
