import { Injector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Apollo, ApolloClient, InMemoryCache, Scalar, gql, type TypedDocumentNode } from '@apollo-orbit/angular';
import { addStateToCache, state } from '@apollo-orbit/core';
import { ApolloLink } from '@apollo/client';
import { firstValueFrom, Observable, of } from 'rxjs';
import { afterEach, expect, test } from 'vitest';

declare module '@apollo/client' {
  // eslint-disable-next-line @typescript-eslint/no-namespace -- Apollo declares `Scalars` inside this namespace.
  namespace ApolloCache {
    interface Scalars { DateTime: { serialized: string; parsed: Date } }
  }
}

interface EventData { event: { __typename: 'Event'; id: string; dates: Array<Date> } }
interface EventVariables { filter: { dates: Array<Date> } }

const query: TypedDocumentNode<EventData, EventVariables> = gql`
  query Event($filter: EventFilter!) {
    event(filter: $filter) { id dates }
  }
`;
const serialized = '2026-09-12T00:00:00.000Z';
const date = new Date(serialized);
const variables = { filter: { dates: [date] } };

function createCache(): InMemoryCache {
  const cache = new InMemoryCache({
    scalars: {
      DateTime: new Scalar<string, Date>({
        parse: value => new Date(value),
        serialize: value => value.toISOString(),
        is: value => value instanceof Date
      })
    },
    inputObjects: { EventFilter: { fields: { dates: '[DateTime]' } } }
  });
  addStateToCache(cache)(state(descriptor => descriptor.typePolicies({
    Event: { fields: { dates: { scalar: '[DateTime]' } } }
  })));
  return cache;
}

afterEach(() => TestBed.resetTestingModule());

test('signal queries serialize nested scalar variables and parse no-cache responses', async () => {
  const requests: Array<Record<string, unknown>> = [];
  const client = new ApolloClient({
    cache: createCache(),
    link: new ApolloLink(operation => {
      requests.push(operation.variables);
      return of({ data: { event: { __typename: 'Event', id: '1', dates: [serialized] } } });
    })
  });
  const apollo = new Apollo(client);
  const injector = TestBed.inject(Injector);
  const watched = apollo.signal.query({ query, variables: () => variables, lazy: true, injector, fetchPolicy: 'no-cache' });
  const once = apollo.signal.query.once({ query, variables: () => variables, lazy: true, injector, fetchPolicy: 'no-cache' });

  await watched.execute();
  const result = await once.execute();

  expect(requests).toEqual([
    { filter: { dates: [serialized] } },
    { filter: { dates: [serialized] } }
  ]);
  expect(watched.data()?.event.dates).toEqual([date]);
  expect(once.data()?.event.dates).toEqual([date]);
  expect(result.data.event.dates[0]).toBeInstanceOf(Date);
  expect(watched.variables()).toEqual(variables);
  watched.terminate();
  once.terminate();
  client.stop();
});

test('Orbit cache watchers preserve parsed scalars after SSR extraction and restoration', async () => {
  const cache = createCache();
  cache.writeQuery({ query, variables, data: { event: { __typename: 'Event', id: '1', dates: [date] } } });
  const snapshot = JSON.parse(JSON.stringify(cache.extract()));
  expect(snapshot['Event:1'].dates).toEqual([serialized]);

  const restored = createCache().restore(snapshot);
  const client = new ApolloClient({ cache: restored, link: ApolloLink.empty() });
  const apollo = new Apollo(client);
  const cached = apollo.signal.cacheQuery.required({ query, variables: () => variables, injector: TestBed.inject(Injector) });
  TestBed.tick();
  const result = await firstValueFrom(apollo.cache.watchQuery.required({ query, variables }));

  expect(result.data.event.dates).toEqual([date]);
  expect(cached.data().event.dates[0]).toBeInstanceOf(Date);
  restored.writeQuery({ query, variables, data: { event: { __typename: 'Event', id: '1', dates: [new Date('2026-09-13T00:00:00.000Z')] } } });
  expect(cached.data().event.dates[0].toISOString()).toBe('2026-09-13T00:00:00.000Z');
  client.stop();
});

test('signal mutations send serialized scalar variables', async () => {
  const mutation: TypedDocumentNode<{ saved: boolean }, EventVariables> = gql`
    mutation Save($filter: EventFilter!) { saved(filter: $filter) }
  `;
  let sent: unknown;
  const client = new ApolloClient({
    cache: createCache(),
    link: new ApolloLink(operation => new Observable(observer => {
      sent = operation.variables;
      observer.next({ data: { saved: true } });
      observer.complete();
    }))
  });
  const result = await new Apollo(client).signal.mutation(mutation).mutate({ variables });
  expect(sent).toEqual({ filter: { dates: [serialized] } });
  expect(result.data.saved).toBe(true);
  client.stop();
});
