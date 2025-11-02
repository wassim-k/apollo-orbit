import { ApolloClient, InMemoryCache } from '@apollo/client';
import { ApolloProvider } from '@apollo/client/react';
import { MockLink } from '@apollo/client/testing';
import { render } from '@testing-library/react';
import React, { useContext } from 'react';
import { describe, expect, it } from 'vitest';
import { ApolloOrbitContext } from '../src/context';

describe('ApolloOrbitContext', () => {
  it('should throw error when mutationManager is accessed without provider', () => {
    const TestComponent = () => {
      const context = useContext(ApolloOrbitContext);

      expect(() => void context.mutationManager).toThrow('Please use <ApolloOrbitProvider states={states}>');

      return null;
    };

    const client = new ApolloClient({
      cache: new InMemoryCache(),
      link: new MockLink([])
    });

    render(
      <ApolloProvider client={client}>
        <TestComponent />
      </ApolloProvider>
    );
  });
});
