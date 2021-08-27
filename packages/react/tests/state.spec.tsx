/* eslint-disable react-hooks/exhaustive-deps */

import { ApolloOrbitProvider, InMemoryCache, modifyQuery, state, StateDefinition, useLazyQuery, useMutation, useQuery } from '@apollo-orbit/react';
import { Mutation as MutationComponent } from '@apollo-orbit/react/components';
import { ApolloClient, ApolloProvider, MutationFunction } from '@apollo/client';
import { MockedProvider } from '@apollo/client/testing';
import { act, render } from '@testing-library/react';
import { GraphQLError } from 'graphql';
import React, { useEffect } from 'react';
import { AddAuthorDocument, AddAuthorMutationVariables, AddBookDocument, AuthorDocument, AuthorsDocument, BookInput, BooksDocument, Mutation, MutationAddBookArgs, Query } from './graphql';

const author1Id = `${Math.random()}`;
const author2Id = `${Math.random()}`;
let effectMock: jest.Mock;

const createTestState = () => state(descriptor => descriptor
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

  .onInit(() => {
    cache.writeQuery({
      query: BooksDocument,
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

  .mutationUpdate(AddBookDocument, (cache, result) => {
    if (!result.data) return;
    const { addBook } = result.data;
    modifyQuery(cache, { query: BooksDocument }, query => query ? { books: [...query.books, addBook] } : query);
  })

  .effect(AddAuthorDocument, result => {
    effectMock(result);
  })
);

const cache = new InMemoryCache();

describe('State', () => {
  let testState: StateDefinition;
  beforeEach(() => {
    effectMock = jest.fn();
    testState = createTestState();
  });
  afterEach(() => cache.restore({}));

  it('should run client resolvers', () => {
    const TestChild = () => {
      const { data, loading } = useQuery(AuthorsDocument);
      if (!loading) {
        expect(data?.authors).toHaveLength(2);
      }
      return null;
    };

    return act(async () => void render(
      <ApolloProvider client={new ApolloClient({ cache })}>
        <ApolloOrbitProvider states={[testState]}>
          <TestChild />
        </ApolloOrbitProvider>
      </ApolloProvider>
    ));
  });

  it('should call type policies read function', () => {
    const TestChild = () => {
      const { data: authorsData } = useQuery(AuthorsDocument);
      const [getAuthor, { data }] = useLazyQuery(AuthorDocument, { variables: { id: author1Id } });

      useEffect(() => {
        if (authorsData) getAuthor();
      }, [authorsData, getAuthor]);

      if (data) {
        expect(data.author.id).toEqual(author1Id);
      }
      return null;
    };

    return act(async () => void render(
      <ApolloProvider client={new ApolloClient({ cache })}>
        <ApolloOrbitProvider states={[testState]}>
          <TestChild />
        </ApolloOrbitProvider>
      </ApolloProvider>
    ));
  });

  it('should call update method and update cache', () => {
    const book: BookInput = { name: 'New Book', authorId: author1Id };

    const TestChild = ({ addBook }: { addBook: MutationFunction<any, any> }) => {
      const [getBooks, { data }] = useLazyQuery(BooksDocument);
      useEffect(() => void addBook().then(() => getBooks()), []);

      if (data) {
        expect(data.books.find((b: any) => b.name === book.name)).toBeDefined();
      }
      return null;
    };

    return act(async () => void render(
      <ApolloProvider client={new ApolloClient({ cache })}>
        <ApolloOrbitProvider states={[testState]}>
          <MutationComponent mutation={AddBookDocument} variables={{ book }}>
            {addBook => <TestChild addBook={addBook} />}
          </MutationComponent>
        </ApolloOrbitProvider>
      </ApolloProvider>
    ));
  });

  it('should merge mutation variables & context from mutationOptions and mutationFunctionOptions', async () => {
    const TestChild = () => {
      const [addAuthor] = useMutation(AddAuthorDocument, { variables: { name: 'Brandon Sanderson' }, context: { context: 'old', context1: '1' } });
      useEffect(() => void addAuthor({ variables: { age: 44 } as AddAuthorMutationVariables, context: { context: 'new', context2: '2' } }), []);
      return null;
    };

    const client = new ApolloClient({ cache });
    const mutateSpy = jest.spyOn(client, 'mutate');

    await act(async () => void render(
      <ApolloProvider client={client}>
        <ApolloOrbitProvider states={[testState]}>
          <TestChild />
        </ApolloOrbitProvider>
      </ApolloProvider>
    ));

    expect(mutateSpy.mock.calls[0][0].variables).toEqual({ name: 'Brandon Sanderson', age: 44 });
    expect(mutateSpy.mock.calls[0][0].context).toEqual({ context: 'new', context1: '1', context2: '2' });
  });

  it('should call effect with onError', async () => {
    const variables: AddAuthorMutationVariables = { name: 'Brandon Sanderson', age: 44 };
    const TestChild = () => {
      const [addAuthor] = useMutation(AddAuthorDocument, {
        onError: () => { /* noop */ }
      });
      useEffect(() => void addAuthor({ variables }), []);
      return null;
    };

    await act(async () => void render(
      <MockedProvider cache={cache} mocks={[
        {
          request: { query: AddAuthorDocument, variables },
          result: {
            errors: [new GraphQLError('Failed to add author')]
          }
        }
      ]}>
        <ApolloOrbitProvider states={[testState]}>
          <TestChild />
        </ApolloOrbitProvider>
      </MockedProvider >
    ));

    await act(() => new Promise(resolve => setTimeout(resolve, 0)));

    expect(effectMock).toBeCalledTimes(1);
    expect(effectMock).toBeCalledWith(expect.objectContaining({
      error: expect.anything()
    }));
  });

  it('should call effect without onError', async () => {
    const variables: AddAuthorMutationVariables = { name: 'Brandon Sanderson', age: 44 };
    const TestChild = () => {
      const [addAuthor] = useMutation(AddAuthorDocument, { errorPolicy: 'all' });
      useEffect(() => void addAuthor({ variables }), []);
      return null;
    };

    await act(async () => void render(
      <MockedProvider cache={cache} mocks={[
        {
          request: { query: AddAuthorDocument, variables },
          result: {
            errors: [new GraphQLError('Failed to add author')]
          }
        }
      ]}>
        <ApolloOrbitProvider states={[testState]}>
          <TestChild />
        </ApolloOrbitProvider>
      </MockedProvider >
    ));

    await act(() => new Promise(resolve => setTimeout(resolve, 0)));

    expect(effectMock).toBeCalledTimes(1);
    expect(effectMock).toBeCalledWith(expect.objectContaining({
      error: expect.anything()
    }));
  });
});
