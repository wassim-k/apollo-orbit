import { ENVIRONMENT_INITIALIZER, EnvironmentProviders, inject, makeEnvironmentProviders, Provider } from '@angular/core';
import { Apollo, ɵAPOLLO_INSTANCE_FACTORY as APOLLO_INSTANCE_FACTORY, ApolloClient, ɵApolloInstanceFactory as ApolloInstanceFactory, ApolloOrbitFeature, DefaultOptions } from '@apollo-orbit/angular';
import { State } from '@apollo-orbit/core';
import { ApolloActions } from './apolloActions';
import { ɵApollo } from './internal/apollo';
import { StateManager } from './internal/stateManager';
import { StateFactory } from './types';

export function withState(...states: Array<State | StateFactory>): ApolloOrbitFeature {
  return {
    kind: 'APOLLO_ORBIT_STATES',
    providers: [
      ApolloActions,
      StateManager,
      { provide: APOLLO_INSTANCE_FACTORY, useFactory: apolloInstanceFactory, deps: [StateManager] },
      getStatesProviders(states)
    ]
  };
}

export function provideStates(...states: Array<State | StateFactory>): EnvironmentProviders {
  return makeEnvironmentProviders(getStatesProviders(states));
}

function getStatesProviders(states: Array<State | StateFactory>): Array<Provider> {
  return states.length > 0
    ? [{ provide: ENVIRONMENT_INITIALIZER, multi: true, useValue: () => addStates(states) }]
    : [];
}

function apolloInstanceFactory(stateManager: StateManager): ApolloInstanceFactory {
  return (clientId: string, client: ApolloClient, defaultOptions?: DefaultOptions): Apollo => {
    const manager = stateManager.createManager(clientId, client);
    return new ɵApollo(client, manager, defaultOptions); // eslint-disable-line new-cap
  };
}

function addStates(states: Array<State | StateFactory>): void {
  inject(StateManager).onAddStates(states.map(state => typeof state === 'function' ? state() : state));
}
