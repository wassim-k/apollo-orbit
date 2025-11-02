import { InjectionToken, inject } from '@angular/core';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Apollo, InMemoryCache, provideApollo, withApolloOptions } from '@apollo-orbit/angular';
import { state, withState } from '@apollo-orbit/angular/state';
import { MockLink } from '@apollo/client/testing';
import { v4 as uuid } from 'uuid';
import { Mock } from 'vitest';
import { ADD_BOOK_MUTATION, AddBookInput, BOOKS_QUERY, gqlAddBookMutation, gqlBooksQuery } from './graphql';

const authorId = uuid();
const MOCK_TOKEN = new InjectionToken('mock');

const testState = () => {
  const mock = inject<Mock>(MOCK_TOKEN);

  return state(descriptor => descriptor
    .refetchQueries(ADD_BOOK_MUTATION, result => {
      mock();
      return [gqlBooksQuery()];
    })
  );
};

describe('RefetchQueries', () => {
  beforeEach(() => {
    MockLink.defaultOptions = { delay: 0 };
    TestBed.configureTestingModule({
      providers: [
        provideApollo(
          withApolloOptions({
            cache: new InMemoryCache(),
            link: new MockLink([
              {
                request: { query: ADD_BOOK_MUTATION, variables: variables => variables },
                result: variables => ({
                  data: {
                    addBook: { __typename: 'Book', id: uuid(), ...variables.book, genre: null }
                  }
                })
              },
              {
                request: { query: BOOKS_QUERY },
                result: {
                  data: {
                    books: []
                  }
                }
              }
            ])
          }),
          withState(testState)
        ),
        { provide: MOCK_TOKEN, useValue: vi.fn() }
      ]
    });
  });

  it('should call refetch method', fakeAsync(() => {
    const apollo = TestBed.inject(Apollo);
    const mock = TestBed.inject(MOCK_TOKEN);
    const book: AddBookInput = { name: 'New Book', authorId };
    apollo.mutate(gqlAddBookMutation({ book })).subscribe();

    tick();

    expect(mock).toHaveBeenCalled();
  }));

  it('should merge refetchQueries from state with function refetchQueries from options', fakeAsync(() => {
    const apollo = TestBed.inject(Apollo);
    const mock = TestBed.inject(MOCK_TOKEN);
    const optionsRefetchMock = vi.fn();
    const book: AddBookInput = { name: 'New Book', authorId };

    apollo.mutate({
      ...gqlAddBookMutation({ book }),
      refetchQueries: result => {
        optionsRefetchMock(result);
        return [gqlBooksQuery()];
      }
    }).subscribe();

    tick();

    expect(mock).toHaveBeenCalled();
    expect(optionsRefetchMock).toHaveBeenCalled();
  }));
});
