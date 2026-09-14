import { State } from '@apollo-orbit/core';
import { ApolloClient } from '@apollo/client';
import { useApolloClient } from '@apollo/client/react';
import React, { JSX, useContext, useMemo } from 'react';
import { ApolloOrbitContext, ApolloOrbitContextValue } from './context';
import { StateManager } from './stateManager';
import { wrapMutate } from './wrapMutate';

const MUTATE = Symbol('ORBIT.MUTATE');

function addStates(stateManager: StateManager, client: ApolloClient, states: Array<State>): ApolloOrbitContextValue {
  const mutationManager = stateManager.addStates(client, states);

  if (!(MUTATE in client)) {
    Object.assign(client, { [MUTATE]: true });
    client.mutate = wrapMutate(mutationManager, client.mutate.bind(client));
  }

  return { stateManager, mutationManager };
}

export function ApolloOrbitProvider({
  states,
  children
}: {
  states: Array<State>;
  children: React.ReactNode;
}): JSX.Element {
  const client = useApolloClient();
  const { stateManager } = useContext(ApolloOrbitContext);
  const context = useMemo(() => addStates(stateManager, client, states), [stateManager, client, states]);

  return (
    <ApolloOrbitContext.Provider value={context}>
      {children}
    </ApolloOrbitContext.Provider>
  );
}
