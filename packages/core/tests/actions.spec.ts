import { MutationManager, state } from '@apollo-orbit/core';
import { ApolloCache, ApolloError, InMemoryCache } from '@apollo/client/core';

interface AddAuthor {
    type: 'add-author';
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

        manager.addState(state(descriptor => descriptor
            .action<AddAuthor>('add-author', action => {
                return new Promise(resolve => {
                    setTimeout(() => {
                        actionMock(action);
                        resolve(void 0);
                    }, 100);
                });
            })
            .action<AddAuthor>('add-author', action => {
                return new Promise(resolve => {
                    setTimeout(() => {
                        actionMock(action);
                        resolve(void 0);
                    }, 50);
                });
            })
        ));

        const action: AddAuthor = { type: 'add-author' };
        await manager.dispatch<AddAuthor>(cache, action);

        expect(actionMock).toBeCalledTimes(2);
        expect(actionMock).nthCalledWith(1, action);
        expect(actionMock).nthCalledWith(2, action);
    });
});
