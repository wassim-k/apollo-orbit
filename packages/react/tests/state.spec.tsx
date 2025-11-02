import { ApolloOrbitProvider, state, useDispatch } from '@apollo-orbit/react';
import { ApolloClient, InMemoryCache } from '@apollo/client';
import { ApolloLink } from '@apollo/client/link';
import { LocalState } from '@apollo/client/local-state';
import { ApolloProvider, useLazyQuery, useMutation, useQuery } from '@apollo/client/react';
import { MockLink } from '@apollo/client/testing';
import { MockedProvider } from '@apollo/client/testing/react';
import { render, waitFor } from '@testing-library/react';
import { GraphQLError } from 'graphql';
import React, { useEffect } from 'react';
import { noop } from 'rxjs';
import { Mock } from 'vitest';
import { ADD_AUTHOR_MUTATION, ADD_BOOK_MUTATION, AddAuthorMutationVariables, AUTHOR_QUERY, AUTHORS_QUERY, BookInput, BOOKS_QUERY, Mutation, MutationAddBookArgs, Query } from './graphql';

const author1Id = `${Math.random()}`;
const author2Id = `${Math.random()}`;
let effectMock: Mock;
let actionMock: Mock;
let nestedActionMock: Mock;

interface AddAuthorAction {
  type: 'author/add';
  author: AddAuthorMutationVariables;
}

interface AuthorAddedAction {
  type: 'author/added';
}

const testState = state(descriptor => descriptor
  .typePolicies({
    Query: {
      fields: {
        author: {
          read: (existing: Query['author'] | undefined, { toReference, args }) => {
            return existing ?? toReference({ __typename: 'Author', id: args?.id });
          }
        }
      }
    }
  })

  .onInit(cache => {
    cache.writeQuery({
      query: BOOKS_QUERY,
      data: {
        books: [
          { __typename: 'Book', id: '1', name: 'Book 1', genre: 'Fiction', authorId: author1Id },
          { __typename: 'Book', id: '2', name: 'Book 2', genre: 'History', authorId: author1Id },
          { __typename: 'Book', id: '3', name: 'Book 3', genre: 'Science', authorId: author1Id },
          { __typename: 'Book', id: '4', name: 'Book 4', genre: 'Biography', authorId: author2Id }
        ]
      }
    });
  })

  .resolver(
    ['Query', 'authors'],
    (rootValue, args, context, info): Promise<Query['authors']> => {
      return Promise.resolve()
        .then(() => [
          { __typename: 'Author', id: author1Id, name: 'Author 1', age: null, books: [] },
          { __typename: 'Author', id: author2Id, name: 'Author 2', age: null, books: [] }
        ]);
    })

  .resolver(
    ['Mutation', 'addBook'],
    (rootValue, { book }: MutationAddBookArgs, context, info): Mutation['addBook'] => {
      return { __typename: 'Book', id: `${Math.random()}`, ...book, genre: null };
    })

  .mutationUpdate(ADD_BOOK_MUTATION, (cache, info) => {
    if (!info.data) return;
    const { addBook } = info.data;
    cache.updateQuery({ query: BOOKS_QUERY }, data => data ? { books: [...data.books, addBook] } : data);
  })

  .effect(ADD_AUTHOR_MUTATION, result => {
    effectMock(result);
  })

  .action<AddAuthorAction>('author/add', (action, { dispatch }) => {
    actionMock(action);
    return dispatch<AuthorAddedAction>({ type: 'author/added' });
  })

  .action<AuthorAddedAction>('author/added', action => {
    nestedActionMock(action);
  })
);

const cache = new InMemoryCache();

describe('State', () => {
  beforeEach(() => {
    effectMock = vi.fn();
    actionMock = vi.fn();
    nestedActionMock = vi.fn();
    MockLink.defaultOptions = { delay: 0 };
  });

  afterEach(() => {
    cache.reset({ discardWatches: true });
    MockLink.defaultOptions = { delay: undefined };
  });

  it('should run client resolvers', async () => {
    const TestChild = () => {
      const { data, loading } = useQuery(AUTHORS_QUERY);
      if (!loading) {
        expect(data?.authors).toHaveLength(2);
      }
      return null;
    };

    render(
      <ApolloProvider client={new ApolloClient({ cache, link: ApolloLink.empty(), localState: new LocalState() })}>
        <ApolloOrbitProvider states={[testState]}>
          <TestChild />
        </ApolloOrbitProvider>
      </ApolloProvider>
    );

    await waitFor(() => { });
  });

  it('should call type policies read function', async () => {
    const TestChild = () => {
      const { data: authorsData } = useQuery(AUTHORS_QUERY);
      const [getAuthor, { data }] = useLazyQuery(AUTHOR_QUERY);

      useEffect(() => {
        if (authorsData) getAuthor({ variables: { id: author1Id } });
      }, [authorsData, getAuthor]);

      if (data) {
        expect(data.author.id).toEqual(author1Id);
      }
      return null;
    };

    render(
      <ApolloProvider client={new ApolloClient({ cache, link: ApolloLink.empty(), localState: new LocalState() })}>
        <ApolloOrbitProvider states={[testState]}>
          <TestChild />
        </ApolloOrbitProvider>
      </ApolloProvider>
    );

    await waitFor(() => { });
  });

  it('should call update method and update cache', async () => {
    const book: BookInput = { name: 'New Book', authorId: author1Id };

    const TestChild = () => {
      const [getBooks, { data }] = useLazyQuery(BOOKS_QUERY);
      const [addBook] = useMutation(ADD_BOOK_MUTATION, { variables: { book } });

      useEffect(() => void addBook().then(() => getBooks()), []);

      if (data) {
        expect(data.books.find(b => b.name === book.name)).toBeDefined();
      }

      return null;
    };

    render(
      <ApolloProvider client={new ApolloClient({ cache, link: ApolloLink.empty(), localState: new LocalState() })}>
        <ApolloOrbitProvider states={[testState]}>
          <TestChild />
        </ApolloOrbitProvider>
      </ApolloProvider>
    );

    await waitFor(() => { });
  });

  it('should call action', async () => {
    const variables: AddAuthorMutationVariables = { name: 'Brandon Sanderson', age: 44 };
    const action: AddAuthorAction = { type: 'author/add', author: variables };
    const TestChild = () => {
      const dispatch = useDispatch();
      useEffect(() => void dispatch(action), []);
      return null;
    };

    render(
      <MockedProvider localState={new LocalState()} cache={cache}>
        <ApolloOrbitProvider states={[testState]}>
          <TestChild />
        </ApolloOrbitProvider>
      </MockedProvider>
    );

    await waitFor(() => {
      expect(actionMock).toHaveBeenCalledTimes(1);
      expect(actionMock).toHaveBeenCalledWith(action);

      expect(nestedActionMock).toHaveBeenCalledTimes(1);
      expect(nestedActionMock).toHaveBeenCalledWith({ type: 'author/added' });
    });
  });

  it('should call effect with onError', async () => {
    const onErrorFn = vi.fn();
    const variables: AddAuthorMutationVariables = { name: 'Brandon Sanderson', age: 44 };
    const TestChild = () => {
      const [addAuthor] = useMutation(ADD_AUTHOR_MUTATION, {
        onError: onErrorFn
      });
      useEffect(() => void addAuthor({ variables }).catch(noop), []);
      return null;
    };

    render(
      <MockedProvider localState={new LocalState()} cache={cache} mocks={[
        {
          request: { query: ADD_AUTHOR_MUTATION, variables },
          result: {
            errors: [new GraphQLError('Failed to add author')]
          }
        }
      ]}>
        <ApolloOrbitProvider states={[testState]}>
          <TestChild />
        </ApolloOrbitProvider>
      </MockedProvider >
    );

    await waitFor(() => {
      expect(onErrorFn).toHaveBeenCalledTimes(1);
      expect(effectMock).toHaveBeenCalledTimes(1);
      expect(effectMock).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.anything()
      }));
    });
  });

  it('should call effect with onError (errorPolicy: all)', async () => {
    const onErrorFn = vi.fn();
    const variables: AddAuthorMutationVariables = { name: 'Brandon Sanderson', age: 44 };
    const TestChild = () => {
      const [addAuthor] = useMutation(ADD_AUTHOR_MUTATION, {
        errorPolicy: 'all',
        onError: onErrorFn
      });
      useEffect(() => void addAuthor({ variables }), []);
      return null;
    };

    render(
      <MockedProvider localState={new LocalState()} cache={cache} mocks={[
        {
          request: { query: ADD_AUTHOR_MUTATION, variables },
          result: {
            errors: [new GraphQLError('Failed to add author')]
          }
        }
      ]}>
        <ApolloOrbitProvider states={[testState]}>
          <TestChild />
        </ApolloOrbitProvider>
      </MockedProvider >
    );

    await waitFor(() => {
      expect(onErrorFn).toHaveBeenCalledTimes(1);
      expect(effectMock).toHaveBeenCalledTimes(1);
      expect(effectMock).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.anything()
      }));
    });
  });

  it('should call effect without onError (errorPolicy: all)', async () => {
    const variables: AddAuthorMutationVariables = { name: 'Brandon Sanderson', age: 44 };
    const TestChild = () => {
      const [addAuthor] = useMutation(ADD_AUTHOR_MUTATION, { errorPolicy: 'all' });
      useEffect(() => void addAuthor({ variables }), []);
      return null;
    };

    render(
      <MockedProvider localState={new LocalState()} cache={cache} mocks={[
        {
          request: { query: ADD_AUTHOR_MUTATION, variables },
          result: {
            errors: [new GraphQLError('Failed to add author')]
          }
        }
      ]}>
        <ApolloOrbitProvider states={[testState]}>
          <TestChild />
        </ApolloOrbitProvider>
      </MockedProvider >
    );

    await waitFor(() => {
      expect(effectMock).toHaveBeenCalledTimes(1);
      expect(effectMock).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.anything()
      }));
    });
  });
});
