import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { Apollo, identifyFragment, InMemoryCache, provideApollo, withApolloOptions } from '@apollo-orbit/angular';
import { state, withState } from '@apollo-orbit/angular/state';
import { MockLink } from '@apollo/client/testing';
import { v4 as uuid } from 'uuid';
import { BookFragmentDoc, gqlUpdateBookMutation, UPDATE_BOOK_MUTATION } from './graphql';

const authorId = uuid();

const testState = () => {
  return state(descriptor => descriptor
    .onInit(cache => {
      cache.writeFragment({
        ...identifyFragment(BookFragmentDoc, '1'),
        data: { __typename: 'Book', id: '1', name: 'Book', authorId, genre: null }
      });
    })
    .optimisticResponse(UPDATE_BOOK_MUTATION, ({ id, book }) => {
      return {
        updateBook: { __typename: 'Book' as const, id, ...book, name: `${book.name} (optimistic)`, authorId, genre: null }
      };
    })
  );
};

describe('OptimisticResponse', () => {
  beforeEach(() => {
    MockLink.defaultOptions = { delay: 10 };
    TestBed.configureTestingModule({
      providers: [
        provideApollo(
          withApolloOptions({
            cache: new InMemoryCache(),
            link: new MockLink([
              {
                request: { query: UPDATE_BOOK_MUTATION, variables: variables => variables },
                result: variables => ({
                  data: {
                    updateBook: { __typename: 'Book', id: variables.id, ...variables.book, authorId, genre: null }
                  }
                }),
                delay: 10
              }
            ])
          }),
          withState(testState)
        )
      ]
    });
  });

  it('should apply optimistic response immediately then update with real data', fakeAsync(() => {
    const apollo = TestBed.inject(Apollo);
    const mutationMock = vi.fn();
    const watchMock = vi.fn();

    apollo.watchFragment({ fragment: BookFragmentDoc, from: { id: '1' } }).subscribe(result => watchMock(result.data));
    apollo.mutate(gqlUpdateBookMutation({ id: '1', book: { name: 'New Book' } })).subscribe(result => mutationMock(result.data));

    tick(10);

    // Fragment watch observable should emit 3 times: the original value, then once for optimistic, once for real result
    expect(watchMock).toHaveBeenCalledTimes(3);
    expect(watchMock).toHaveBeenNthCalledWith(1, expect.objectContaining({ name: 'Book' }));
    expect(watchMock).toHaveBeenNthCalledWith(2, expect.objectContaining({ name: 'New Book (optimistic)' }));
    expect(watchMock).toHaveBeenNthCalledWith(3, expect.objectContaining({ name: 'New Book' }));

    // Mutation observable should only emit once with real result
    expect(mutationMock).toHaveBeenCalledTimes(1);
    expect(mutationMock).toHaveBeenCalledWith(expect.objectContaining({ updateBook: expect.objectContaining({ name: 'New Book' }) }));
  }));
});
