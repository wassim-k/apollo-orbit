/* eslint-disable react-hooks/exhaustive-deps */

import { state } from '@apollo-orbit/core';
import { ApolloOrbitProvider } from '@apollo-orbit/react';
import { Query } from '@apollo-orbit/react/components';
import { ApolloClient, ApolloProvider, gql, InMemoryCache } from '@apollo/client';
import { act, render } from '@testing-library/react';
import React from 'react';

const cache = new InMemoryCache();

const client1 = new ApolloClient({ cache });
const testState1 = state(descriptor => descriptor
  .resolver(
    ['Query', 'value1'],
    (rootValue, args, context, info): Promise<string> =>
      Promise.resolve().then(() => {
        return 'state1';
      })
  )
);

const client2 = new ApolloClient({ cache });
const testState2 = state(descriptor => descriptor
  .resolver(
    ['Query', 'value2'],
    (rootValue, args, context, info): Promise<string> =>
      Promise.resolve().then(() => {
        return 'state2';
      })
  )
);

describe('Multi', () => {
  it('should render multiple clients', () => {
    return act(async () => void render(
      <>
        <ApolloProvider client={client1}>
          <ApolloOrbitProvider states={[testState1]}>
            <Query query={gql`query { value1 @client }`}>
              {result => {
                if (!result.loading) {
                  expect(result.data).toEqual({ value1: 'state1' });
                }
                return null;
              }}
            </Query>
          </ApolloOrbitProvider>
        </ApolloProvider>
        <ApolloProvider client={client2}>
          <ApolloOrbitProvider states={[testState2]}>
            <Query query={gql`query { value2 @client }`}>
              {result => {
                if (!result.loading) {
                  expect(result.data).toEqual({ value2: 'state2' });
                }
                return null;
              }}
            </Query>
          </ApolloOrbitProvider>
        </ApolloProvider>
      </>
    ));
  });

  it('should add states lazily', () => {
    return act(async () => void render(
      <>
        <ApolloProvider client={client1}>
          <ApolloOrbitProvider states={[testState1]}>
            <ApolloOrbitProvider states={[testState2]}>
              <Query query={gql`query { value1 @client, value2 @client }`}>
                {result => {
                  if (!result.loading) {
                    expect(result.data).toEqual({ value1: 'state1', value2: 'state2' });
                  }
                  return null;
                }}
              </Query>
            </ApolloOrbitProvider>
          </ApolloOrbitProvider>
        </ApolloProvider>
      </>
    ));
  });
});
