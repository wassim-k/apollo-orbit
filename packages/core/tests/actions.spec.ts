import { Action, ActionInstance, MutationManager, resolveDispatchResults, state } from '@apollo-orbit/core';
import { ApolloCache, ApolloError, InMemoryCache, gql } from '@apollo/client/core';

interface AddAuthor {
    type: 'add-author';
}

interface AddAuthorSuccess {
    type: 'add-author-success';
}

describe('Actions', () => {
    let cache: ApolloCache<any>;
    let manager: MutationManager;

    beforeEach(() => {
        cache = new InMemoryCache();
        manager = new MutationManager(graphQLErrors => new ApolloError({ graphQLErrors }));
    });

    it('Should wait for all actions to complete before returning promise', async () => {
        const actionMock = jest.fn();
        const nestedActionMock = jest.fn();
        const error = new Error();

        manager.addState(state(descriptor => descriptor
            .action<AddAuthor>('add-author', action => {
                return new Promise((resolve, reject) => {
                    setTimeout(() => {
                        actionMock(action);
                        reject(error);
                    }, 100);
                });
            })
            .action<AddAuthor>('add-author', (action, { dispatch }) => {
                return new Promise(resolve => {
                    setTimeout(() => {
                        actionMock(action);
                        dispatch<AddAuthorSuccess>({ type: 'add-author-success' }).then(() => {
                            resolve(void 0);
                        });
                    }, 100);
                });
            })
            .action<AddAuthorSuccess>('add-author-success', action => {
                return new Promise(resolve => {
                    setTimeout(() => {
                        nestedActionMock(action);
                        resolve(void 0);
                    }, 50);
                });
            })
        ));

        const addAuthorAction = { type: 'add-author' };
        const dispatch = <TAction extends Action | ActionInstance>(action: TAction): Promise<void> => manager.dispatch({ cache, dispatch }, action).then(resolveDispatchResults);
        const result = await manager.dispatch({ cache, dispatch }, addAuthorAction);

        expect(result).toEqual([
            {
                action: {
                    type: 'add-author'
                },
                error,
                status: 'error'
            },
            {
                action: {
                    type: 'add-author'
                },
                status: 'success'
            }
        ]);
        expect(actionMock).toHaveBeenCalledTimes(2);
        expect(actionMock).toHaveBeenNthCalledWith(1, addAuthorAction);
        expect(actionMock).toHaveBeenNthCalledWith(2, addAuthorAction);
        expect(nestedActionMock).toHaveBeenCalledTimes(1);
        expect(nestedActionMock).toHaveBeenCalledWith({ type: 'add-author-success' });
    });

    it('Should execute multiple actions', async () => {
        const cacheCallbackMock = jest.fn();

        cache.watch({
            query: gql`query { test1 test2 }`,
            optimistic: true,
            callback: diff => {
                cacheCallbackMock(diff.result);
            }
        });

        manager.addState(state(descriptor => descriptor
            .action<AddAuthor>('add-author', (action, { cache: c }) => {
                c.writeQuery({ query: gql`query { test1 }`, data: { test1: 1 } });
            })
            .action<AddAuthor>('add-author', (action, { cache: c }) => {
                c.writeQuery({ query: gql`query { test2 }`, data: { test2: 2 } });
            })
        ));

        const dispatch = <TAction extends Action | ActionInstance>(action: TAction): Promise<void> => manager.dispatch({ cache, dispatch }, action).then(resolveDispatchResults);
        await manager.dispatch({ cache, dispatch }, { type: 'add-author' });
        expect(cacheCallbackMock).toHaveBeenCalledTimes(2);
        expect(cacheCallbackMock).toHaveBeenCalledWith({ test1: 1, test2: 2 });
    });

    it('Should execute multiple actions (promises)', async () => {
        const cacheCallbackMock = jest.fn();

        cache.watch({
            query: gql`query { test1 test2 }`,
            optimistic: true,
            callback: diff => {
                cacheCallbackMock(diff.result);
            }
        });

        manager.addState(state(descriptor => descriptor
            .action<AddAuthor>('add-author', (action, { cache: c }) => {
                return new Promise(resolve => {
                    setTimeout(() => {
                        c.writeQuery({ query: gql`query { test1 }`, data: { test1: 1 } });
                        resolve(void 0);
                    }, 50);
                });
            })
            .action<AddAuthor>('add-author', (action, { cache: c }) => {
                return new Promise(resolve => {
                    setTimeout(() => {
                        c.writeQuery({ query: gql`query { test2 }`, data: { test2: 2 } });
                        resolve(void 0);
                    }, 100);
                });
            })
        ));

        const dispatch = <TAction extends Action | ActionInstance>(action: TAction): Promise<void> => manager.dispatch({ cache, dispatch }, action).then(resolveDispatchResults);
        await manager.dispatch({ cache, dispatch }, { type: 'add-author' });
        expect(cacheCallbackMock).toHaveBeenCalledTimes(2);
        expect(cacheCallbackMock).toHaveBeenCalledWith({ test1: 1, test2: 2 });
    });
});
