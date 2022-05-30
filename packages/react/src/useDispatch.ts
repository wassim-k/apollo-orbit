import { Action, ActionInstance, resolveDispatchResults } from '@apollo-orbit/core';
import { useApolloClient } from '@apollo/client';
import { useCallback, useContext } from 'react';
import { ApolloOrbitContext } from './context';

export function useDispatch(): <TActions extends Array<Action | ActionInstance>>(...actions: TActions) => Promise<void> {
  const { cache } = useApolloClient();
  const { mutationManager } = useContext(ApolloOrbitContext);
  const dispatch = useCallback(
    (...actions: Array<Action>) => mutationManager.dispatch({ cache, dispatch }, ...actions).then(resolveDispatchResults),
    [cache, mutationManager]
  );
  return dispatch;
}
