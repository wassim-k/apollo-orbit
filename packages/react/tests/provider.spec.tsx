import { state } from '@apollo-orbit/core';
import { ApolloOrbitProvider } from '@apollo-orbit/react';
import { ApolloClient, InMemoryCache } from '@apollo/client';
import { ApolloProvider } from '@apollo/client/react';
import { MockLink } from '@apollo/client/testing';
import { render } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';

describe('ApolloOrbitProvider', () => {
  it('should render children after initialization', () => {
    const testState = state(descriptor => descriptor);

    const TestComponent = () => {
      return <div>Initialized</div>;
    };

    const client = new ApolloClient({
      cache: new InMemoryCache(),
      link: new MockLink([])
    });

    const { container } = render(
      <ApolloProvider client={client}>
        <ApolloOrbitProvider states={[testState]}>
          <TestComponent />
        </ApolloOrbitProvider>
      </ApolloProvider>
    );

    expect(container.textContent).toBe('Initialized');
  });

  it('should handle empty states array', () => {
    const TestComponent = () => {
      return <div>Empty States</div>;
    };

    const client = new ApolloClient({
      cache: new InMemoryCache(),
      link: new MockLink([])
    });

    const { container } = render(
      <ApolloProvider client={client}>
        <ApolloOrbitProvider states={[]}>
          <TestComponent />
        </ApolloOrbitProvider>
      </ApolloProvider>
    );

    expect(container.textContent).toBe('Empty States');
  });

  it('should handle null children', () => {
    const testState = state(descriptor => descriptor);

    const client = new ApolloClient({
      cache: new InMemoryCache(),
      link: new MockLink([])
    });

    const { container } = render(
      <ApolloProvider client={client}>
        <ApolloOrbitProvider states={[testState]}>
          {null}
        </ApolloOrbitProvider>
      </ApolloProvider>
    );

    expect(container.textContent).toBe('');
  });

  it('should handle array of children', () => {
    const testState = state(descriptor => descriptor);

    const client = new ApolloClient({
      cache: new InMemoryCache(),
      link: new MockLink([])
    });

    const { container } = render(
      <ApolloProvider client={client}>
        <ApolloOrbitProvider states={[testState]}>
          {[
            <div key="1">Child 1</div>,
            <div key="2">Child 2</div>
          ]}
        </ApolloOrbitProvider>
      </ApolloProvider>
    );

    expect(container.textContent).toBe('Child 1Child 2');
  });
});
