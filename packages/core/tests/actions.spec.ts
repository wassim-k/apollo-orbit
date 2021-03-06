import { Action, MutationManager, resolveDispatchResults, state } from '@apollo-orbit/core';
import { ApolloCache, ApolloError, gql, InMemoryCache } from '@apollo/client/core';

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
                        dispatch<[AddAuthorSuccess]>({ type: 'add-author-success' }).then(() => {
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

        const action: AddAuthor = { type: 'add-author' };
        const dispatch = (...actions: Array<Action>) => manager.dispatch({ cache, dispatch }, ...actions).then(resolveDispatchResults);
        const result = await manager.dispatch({ cache, dispatch }, action);

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
        expect(actionMock).toBeCalledTimes(2);
        expect(actionMock).nthCalledWith(1, action);
        expect(actionMock).nthCalledWith(2, action);
        expect(nestedActionMock).toBeCalledTimes(1);
        expect(nestedActionMock).toBeCalledWith({ type: 'add-author-success' });
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

        const action: AddAuthor = { type: 'add-author' };
        const dispatch = (...actions: Array<Action>) => manager.dispatch({ cache, dispatch }, ...actions).then(resolveDispatchResults);
        await manager.dispatch({ cache, dispatch }, action);
        expect(cacheCallbackMock).toBeCalledTimes(2);
        expect(cacheCallbackMock).toBeCalledWith({ test1: 1, test2: 2 });
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

        const action: AddAuthor = { type: 'add-author' };
        const dispatch = (...actions: Array<Action>) => manager.dispatch({ cache, dispatch }, ...actions).then(resolveDispatchResults);
        await manager.dispatch({ cache, dispatch }, action);
        expect(cacheCallbackMock).toBeCalledTimes(2);
        expect(cacheCallbackMock).toBeCalledWith({ test1: 1, test2: 2 });
    });
});
