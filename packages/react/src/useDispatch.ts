import { Action, ActionInstance, resolveDispatchResults } from '@apollo-orbit/core';
import { useApolloClient } from '@apollo/client/react';
import { useCallback, useContext } from 'react';
import { ApolloOrbitContext } from './context';

export function useDispatch(): <TAction extends Action | ActionInstance>(action: TAction) => Promise<void> {
  const { cache } = useApolloClient();
  const { mutationManager } = useContext(ApolloOrbitContext);
  return useCallback(
    function dispatch<TAction extends Action | ActionInstance>(action: TAction): Promise<void> {
      return mutationManager.dispatch(action, { cache, dispatch }).then(resolveDispatchResults);
    },
    [cache, mutationManager]
  );
}
