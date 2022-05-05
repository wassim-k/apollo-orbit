import { StateDefinition } from '@apollo-orbit/core';
import { useApolloClient } from '@apollo/client';
import React, { useContext, useMemo } from 'react';
import { ApolloOrbitContext } from './context';
import { StateManager } from './stateManager';

export function ApolloOrbitProvider({
  states,
  children
}: {
  states: Array<StateDefinition>;
  children: React.ReactNode | Array<React.ReactNode> | null;
}): JSX.Element {
  const client = useApolloClient();
  const context = useContext(ApolloOrbitContext);

  const childContext = useMemo(() => {
    const stateManager = context.root ? new StateManager() : context.stateManager;
    const mutationManager = stateManager.addStates(client, states);
    return { root: false, stateManager, mutationManager };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <ApolloOrbitContext.Provider value={childContext}>
      {children}
    </ApolloOrbitContext.Provider>
  );
}
