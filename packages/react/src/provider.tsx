import { StateDefinition } from '@apollo-orbit/core';
import { useApolloClient } from '@apollo/client';
import React, { useContext, useMemo } from 'react';
import { ApolloOrbitContext } from './context';

export function ApolloOrbitProvider({
  states,
  children
}: {
  states: Array<StateDefinition>;
  children: React.ReactNode | Array<React.ReactNode> | null;
}): JSX.Element {
  const client = useApolloClient();
  const { stateManager } = useContext(ApolloOrbitContext);

  const context = useMemo(() => {
    const mutationManager = stateManager.addStates(client, states);
    return { stateManager, mutationManager };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <ApolloOrbitContext.Provider value={context}>
      {children}
    </ApolloOrbitContext.Provider>
  );
}
