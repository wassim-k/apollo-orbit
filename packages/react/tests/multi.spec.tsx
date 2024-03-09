/* eslint-disable prefer-const */
/* eslint-disable react-hooks/exhaustive-deps */

import { state } from '@apollo-orbit/core';
import { ApolloOrbitProvider } from '@apollo-orbit/react';
import { ApolloClient, ApolloProvider, gql, InMemoryCache, useMutation, useQuery } from '@apollo/client';
import { MockLink } from '@apollo/client/testing';
import { act, render } from '@testing-library/react';
import React, { useEffect } from 'react';
import * as wrapMutate from '../src/wrapMutate';
import { AddAuthorDocument } from './graphql';

let update1Mock: jest.Mock;
let update2Mock: jest.Mock;

const cache1 = new InMemoryCache();
const cache2 = new InMemoryCache();

const testState1 = state(descriptor => descriptor
  .resolver(
    ['Query', 'value1'],
    (rootValue, args, context, info): Promise<string> =>
      Promise.resolve().then(() => {
        return 'state1';
      })
  )
  .mutationUpdate(AddAuthorDocument, () => {
    update1Mock();
  })
);

const testState2 = state(descriptor => descriptor
  .resolver(
    ['Query', 'value2'],
    (rootValue, args, context, info): Promise<string> =>
      Promise.resolve().then(() => {
        return 'state2';
      })
  )
  .mutationUpdate(AddAuthorDocument, () => {
    update2Mock();
  })
);

describe('Multi', () => {
  beforeEach(() => {
    update1Mock = jest.fn();
    update2Mock = jest.fn();
  });

  afterEach(() => {
    cache1.reset({ discardWatches: true });
    cache2.reset({ discardWatches: true });
  });

  it('should render multiple clients', async () => {
    const TestChild1 = () => {
      const [addAuthor] = useMutation(AddAuthorDocument);
      useEffect(() => void addAuthor({ variables: { name: 'Author 1' } }), []);

      const { data, loading } = useQuery(gql`query { value1 @client }`);
      if (!loading) {
        expect(data).toEqual({ value1: 'state1' });
      }
      return null;
    };

    const TestChild2 = () => {
      const [addAuthor] = useMutation(AddAuthorDocument);
      useEffect(() => void addAuthor({ variables: { name: 'Author 2' } }), []);

      const { data, loading } = useQuery(gql`query { value2 @client }`);
      if (!loading) {
        expect(data).toEqual({ value2: 'state2' });
      }

      return null;
    };

    const client1 = new ApolloClient({
      cache: cache1,
      link: new MockLink([
        {
          request: { query: AddAuthorDocument, variables: { name: 'Author 1' } },
          result: {
            data: { addAuthor: { __typename: 'Author', id: '1', name: 'Author 1' } }
          }
        }
      ])
    });

    const client2 = new ApolloClient({
      cache: cache2,
      link: new MockLink([
        {
          request: { query: AddAuthorDocument, variables: { name: 'Author 2' } },
          result: {
            data: { addAuthor: { __typename: 'Author', id: '2', name: 'Author 2' } }
          }
        }
      ])
    });

    await act(async () => void render(
      <>
        <ApolloProvider client={client1}>
          <ApolloOrbitProvider states={[testState1]}>
            <TestChild1 />
          </ApolloOrbitProvider>
        </ApolloProvider>
        <ApolloProvider client={client2}>
          <ApolloOrbitProvider states={[testState2]}>
            <TestChild2 />
          </ApolloOrbitProvider>
        </ApolloProvider>
      </>
    ));

    await act(() => new Promise(resolve => setTimeout(resolve, 0)));

    expect(update1Mock).toHaveBeenCalledTimes(1);
    expect(update2Mock).toHaveBeenCalledTimes(1);
  });

  it('should render multiple providers for the same client', async () => {
    const TestChild1 = () => {
      const [addAuthor] = useMutation(AddAuthorDocument);
      useEffect(() => void addAuthor({ variables: { name: 'Author 1' } }), []);

      const { data, loading } = useQuery(gql`query { value1 @client }`);
      if (!loading) {
        expect(data).toEqual({ value1: 'state1' });
      }
      return null;
    };

    const TestChild2 = () => {
      const [addAuthor] = useMutation(AddAuthorDocument);
      useEffect(() => void addAuthor({ variables: { name: 'Author 2' } }), []);

      const { data, loading } = useQuery(gql`query { value2 @client }`);
      if (!loading) {
        expect(data).toEqual({ value2: 'state2' });
      }

      return null;
    };

    const client1 = new ApolloClient({
      cache: cache1,
      link: new MockLink([
        {
          request: { query: AddAuthorDocument, variables: { name: 'Author 1' } },
          result: {
            data: { addAuthor: { __typename: 'Author', id: '1', name: 'Author 1' } }
          }
        },
        {
          request: { query: AddAuthorDocument, variables: { name: 'Author 2' } },
          result: {
            data: { addAuthor: { __typename: 'Author', id: '2', name: 'Author 2' } }
          }
        }
      ])
    });

    await act(async () => void render(
      <>
        <ApolloProvider client={client1}>
          <ApolloOrbitProvider states={[testState1]}>
            <TestChild1 />
          </ApolloOrbitProvider>
          <ApolloOrbitProvider states={[testState2]}>
            <TestChild2 />
          </ApolloOrbitProvider>
        </ApolloProvider>
      </>
    ));

    await act(() => new Promise(resolve => setTimeout(resolve, 0)));

    expect(update1Mock).toHaveBeenCalledTimes(2);
    expect(update2Mock).toHaveBeenCalledTimes(2);
  });

  it('should add states lazily', async () => {
    const wrapMutateSpy = jest.spyOn(wrapMutate, 'wrapMutate');

    const client1 = new ApolloClient({
      cache: cache1,
      link: new MockLink([
        {
          request: { query: AddAuthorDocument, variables: { name: 'Author 1' } },
          result: {
            data: { addAuthor: { __typename: 'Author', id: '1', name: 'Author 1' } }
          }
        }
      ])
    });

    const TestChild = () => {
      const [addAuthor] = useMutation(AddAuthorDocument);
      useEffect(() => void addAuthor({ variables: { name: 'Author 1' } }), []);

      const { data, loading } = useQuery(gql`query { value1 @client }`);
      if (!loading) {
        expect(data).toEqual({ value1: 'state1' });
      }
      return null;
    };

    await act(async () => void render(
      <>
        <ApolloProvider client={client1}>
          <ApolloOrbitProvider states={[testState1]}>
            <ApolloOrbitProvider states={[testState2]}>
              <TestChild />
            </ApolloOrbitProvider>
          </ApolloOrbitProvider>
        </ApolloProvider>
      </>
    ));

    await act(() => new Promise(resolve => setTimeout(resolve, 0)));

    expect(update1Mock).toHaveBeenCalledTimes(1);
    expect(update2Mock).toHaveBeenCalledTimes(1);
    expect(wrapMutateSpy).toHaveBeenCalledTimes(1);
  });

  it('should support passing the client as an argument', async () => {
    const client1 = new ApolloClient({
      cache: cache1,
      link: new MockLink([
        {
          request: { query: AddAuthorDocument, variables: { name: 'Author 1' } },
          result: {
            data: { addAuthor: { __typename: 'Author', id: '1', name: 'Author 1' } }
          }
        },
        {
          request: { query: AddAuthorDocument, variables: { name: 'Author 2' } },
          result: {
            data: { addAuthor: { __typename: 'Author', id: '2', name: 'Author 2' } }
          }
        }
      ])
    });

    const client2 = new ApolloClient({
      cache: cache2,
      link: new MockLink([])
    });

    const TestChild1 = () => {
      const [addAuthor] = useMutation(AddAuthorDocument);
      useEffect(() => void addAuthor({ variables: { name: 'Author 1' } }), []);

      const { data, loading } = useQuery(gql`query { value1 @client }`);
      if (!loading) {
        expect(data).toEqual({ value1: 'state1' });
      }
      return null;
    };

    const TestChild2 = () => {
      const [addAuthor] = useMutation(AddAuthorDocument, { client: client1 });
      useEffect(() => void addAuthor({ variables: { name: 'Author 2' } }), []);

      const { data, loading } = useQuery(gql`query { value2 @client }`);
      if (!loading) {
        expect(data).toEqual({ value2: 'state2' });
      }

      return null;
    };

    await act(async () => void render(
      <>
        <ApolloProvider client={client1}>
          <ApolloOrbitProvider states={[testState1]}>
            <TestChild1 />
          </ApolloOrbitProvider>
        </ApolloProvider>
        <ApolloProvider client={client2}>
          <ApolloOrbitProvider states={[testState2]}>
            <TestChild2 />
          </ApolloOrbitProvider>
        </ApolloProvider>
      </>
    ));

    await act(() => new Promise(resolve => setTimeout(resolve, 0)));

    expect(update1Mock).toHaveBeenCalledTimes(2);
    expect(update2Mock).toHaveBeenCalledTimes(0);
  });
});
