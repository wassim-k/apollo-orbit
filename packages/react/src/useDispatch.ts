import { Action } from '@apollo-orbit/core';
import { useApolloClient } from '@apollo/client';
import { useContext } from 'react';
import { ApolloOrbitContext } from './context';

export function useDispatch(): <TAction extends Action>(action: TAction) => void {
  const client = useApolloClient();
  const { mutationManager } = useContext(ApolloOrbitContext);
  return mutationManager.dispatch.bind(mutationManager, client.cache);
}
