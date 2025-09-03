import { StateFactory } from '@apollo-orbit/angular/state';
import { Action, ActionInstance, MutationManager, resolveDispatchResults, state } from '@apollo-orbit/core';
import { ApolloCache, ApolloClient, gql, InMemoryCache } from '@apollo/client';
import { ApolloLink } from '@apollo/client/link';
import { skip } from 'rxjs';

interface UpdateValueAction {
  type: 'value/update';
  value: number;
}

const testState: StateFactory = () => state(descriptor => descriptor
  .action<UpdateValueAction>('value/update', (action, { cache, dispatch }) => {
    cache.writeQuery({ query: gql`query { value }`, data: { value: action.value } });
  })
);

describe('State', () => {
  let manager: MutationManager;
  let client: ApolloClient;
  let cache: ApolloCache;
  let dispatch: <TAction extends Action | ActionInstance>(action: TAction) => Promise<void>;

  beforeEach(() => {
    manager = new MutationManager();
    cache = new InMemoryCache();
    client = new ApolloClient({ cache, link: ApolloLink.empty() });
    manager.addState(testState());
    dispatch = <TAction extends Action | ActionInstance>(action: TAction): Promise<void> => manager.dispatch(action, { cache, dispatch }).then(resolveDispatchResults);
  });

  it('should call watchQuery before resolving dispatch promise', async () => {
    const mockFn = jest.fn();

    client.watchQuery({ query: gql`query { value }`, fetchPolicy: 'cache-only' }).pipe(
      skip(1) // Skip initial value
    ).subscribe(() => mockFn('watched'));

    await Promise.all([
      manager.dispatch({ type: 'value/update', value: 1 }, { cache, dispatch }),
      manager.dispatch({ type: 'value/update', value: 2 }, { cache, dispatch }),
      manager.dispatch({ type: 'value/update', value: 3 }, { cache, dispatch })
    ]).then(() => mockFn('dispatched'));

    expect(mockFn).toHaveBeenCalledTimes(2);
    expect(mockFn.mock.calls[0][0]).toBe('watched');
    expect(mockFn.mock.calls[1][0]).toBe('dispatched');
  });
});
