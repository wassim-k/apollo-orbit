import { Action, ActionInstance, resolveDispatchResults } from '@apollo-orbit/core';
import { useApolloClient } from '@apollo/client';
import { useCallback, useContext } from 'react';
import { ApolloOrbitContext } from './context';

export function useDispatch(): <TAction extends Action | ActionInstance>(action: TAction) => Promise<void> {
  const { cache } = useApolloClient();
  const { mutationManager } = useContext(ApolloOrbitContext);
  const dispatch = useCallback(
    <TAction extends Action | ActionInstance>(action: TAction): Promise<void> => mutationManager.dispatch({ cache, dispatch }, action).then(resolveDispatchResults),
    [cache, mutationManager]
  );
  return dispatch;
}
