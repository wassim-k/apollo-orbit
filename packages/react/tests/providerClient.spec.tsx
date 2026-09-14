import { state } from '@apollo-orbit/core';
import { ApolloOrbitProvider } from '@apollo-orbit/react';
import { ApolloClient, ApolloLink, gql, InMemoryCache } from '@apollo/client';
import { ApolloProvider, useQuery } from '@apollo/client/react';
import { render } from '@testing-library/react';
import React, { type JSX, StrictMode } from 'react';
import { of } from 'rxjs';

describe('ApolloOrbitProvider', () => {
  it('registers state on a replacement client without duplicating registrations when switching back', async () => {
    const mutation = gql`mutation Save { saved }`;
    const query = gql`query LocalValue { value }`;
    const initialize = vi.fn();
    const effect = vi.fn();
    const definition = state(descriptor => descriptor
      .onInit(initialize)
      .effect(mutation, effect)
      .typePolicies({ Query: { fields: { value: { read: () => 'ready' } } } })
    );
    const createClient = (): ApolloClient => new ApolloClient({
      cache: new InMemoryCache(),
      link: new ApolloLink(() => of({ data: { saved: true } }))
    });
    const first = createClient();
    const second = createClient();

    function Child(): JSX.Element {
      const { data } = useQuery<{ value: string }>(query, { fetchPolicy: 'cache-only' });
      return <output>{data?.value}</output>;
    }

    const tree = (client: ApolloClient): JSX.Element => (
      <StrictMode>
        <ApolloProvider client={client}>
          <ApolloOrbitProvider states={[definition]}><Child /></ApolloOrbitProvider>
        </ApolloProvider>
      </StrictMode>
    );
    const view = render(tree(first));
    expect(view.getByRole('status').textContent).toBe('ready');
    await first.mutate({ mutation });

    view.rerender(tree(second));
    expect(view.getByRole('status').textContent).toBe('ready');
    await second.mutate({ mutation });

    view.rerender(tree(first));
    await first.mutate({ mutation });
    expect(initialize.mock.calls).toEqual([[first.cache], [second.cache]]);
    expect(effect).toHaveBeenCalledTimes(3);
    view.unmount();
    first.stop();
    second.stop();
  });
});
