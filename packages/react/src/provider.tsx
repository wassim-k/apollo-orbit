import { State, createSymbol } from '@apollo-orbit/core';
import { useApolloClient } from '@apollo/client';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { ApolloOrbitContext, ApolloOrbitContextValue } from './context';
import { wrapMutate } from './wrapMutate';

const wrappedSymbol = createSymbol('apollo-orbit.mutate-wrapped');

export function ApolloOrbitProvider({
  states,
  children
}: {
  states: Array<State>;
  children: React.ReactNode | Array<React.ReactNode> | null;
}): JSX.Element | null {
  const initialised = useRef(false); // execute effect once in strict mode.
  const client = useApolloClient();
  const { stateManager } = useContext(ApolloOrbitContext);
  const [context, setContext] = useState<ApolloOrbitContextValue | null>(null);

  useEffect(() => {
    if (!initialised.current) {
      initialised.current = true;

      const mutationManager = stateManager.addStates(client, states);

      if (!(wrappedSymbol in client)) {
        Object.assign(client, { [wrappedSymbol]: true });
        client.mutate = wrapMutate(mutationManager, client.mutate.bind(client));
      }

      setContext({ stateManager, mutationManager });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return context && (
    <ApolloOrbitContext.Provider value={context}>
      {children}
    </ApolloOrbitContext.Provider>
  );
}
