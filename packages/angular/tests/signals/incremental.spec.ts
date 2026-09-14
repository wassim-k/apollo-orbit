import { Injector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Apollo, ApolloClient, gql, InMemoryCache } from '@apollo-orbit/angular';
import { ApolloLink, NetworkStatus, type TypedDocumentNode } from '@apollo/client';
import { GraphQL17Alpha9Handler } from '@apollo/client/incremental';
import { Kind, visit } from 'graphql';
import { Observable, Subject } from 'rxjs';

describe('incremental signal queries', () => {
  it('labels deferred selections and preserves cache read transforms between chunks', async () => {
    const query = gql`
      query Greeting { greeting { message ... @defer { recipient { name } } } }
    `;
    const chunks = new Subject<GraphQL17Alpha9Handler.InitialResult | GraphQL17Alpha9Handler.SubsequentResult>();
    let label: string | undefined;
    const client = new ApolloClient({
      cache: new InMemoryCache({
        typePolicies: { Greeting: { fields: { message: { read: (value: string) => value.toUpperCase() } } } }
      }),
      link: new ApolloLink(operation => {
        visit(operation.query, {
          Directive(node) {
            if (node.name.value !== 'defer') return;
            const argument = node.arguments?.find(argument => argument.name.value === 'label');
            if (argument?.value.kind === Kind.STRING) label = argument.value.value;
          }
        });
        return chunks as Observable<ApolloLink.Result>;
      }),
      incrementalHandler: new GraphQL17Alpha9Handler()
    });
    const watched = new Apollo(client).signal.query({ query, lazy: true, injector: TestBed.inject(Injector) });
    const result = watched.execute();
    expect(label).toEqual(expect.any(String));

    chunks.next({
      data: { greeting: { __typename: 'Greeting', message: 'hello' } },
      pending: [{ id: '0', path: ['greeting'], label }],
      hasNext: true
    });
    expect(watched.result()).toMatchObject({
      data: { greeting: { message: 'HELLO' } }, dataState: 'streaming', networkStatus: NetworkStatus.streaming
    });

    chunks.next({
      incremental: [{ id: '0', data: { recipient: { __typename: 'Person', name: 'Ada' } } }],
      completed: [{ id: '0' }],
      hasNext: false
    });
    chunks.complete();
    expect((await result).data).toMatchObject({ greeting: { message: 'HELLO', recipient: { name: 'Ada' } } });
    expect(watched.result()).toMatchObject({ dataState: 'complete', loading: false });
    watched.terminate();
    client.stop();
  });

  it('keeps complete stream data loading until the final chunk arrives', async () => {
    const query: TypedDocumentNode<{ values: Array<number> }> = gql`
      query Values { values @stream(initialCount: 1) }
    `;
    const chunks = new Subject<GraphQL17Alpha9Handler.InitialResult | GraphQL17Alpha9Handler.SubsequentResult>();
    const client = new ApolloClient({
      cache: new InMemoryCache(),
      link: new ApolloLink(() => chunks as Observable<ApolloLink.Result>),
      incrementalHandler: new GraphQL17Alpha9Handler()
    });
    const apollo = new Apollo(client);
    const injector = TestBed.inject(Injector);
    const watched = apollo.signal.query({ query, lazy: true, injector });
    const once = apollo.signal.query.once({ query, lazy: true, injector });
    const watchedResult = watched.execute();
    const onceResult = once.execute();
    let resolved = false;
    void onceResult.then(() => {
      resolved = true;
    });

    chunks.next({ data: { values: [1] }, pending: [{ id: '0', path: ['values'] }], hasNext: true });
    await Promise.resolve();

    expect(watched.result()).toMatchObject({
      data: { values: [1] }, dataState: 'complete', loading: true, networkStatus: NetworkStatus.streaming
    });
    expect(resolved).toBe(false);

    chunks.next({ incremental: [{ id: '0', items: [2] }], completed: [{ id: '0' }], hasNext: false });
    chunks.complete();

    expect((await watchedResult).data).toEqual({ values: [1, 2] });
    expect((await onceResult).data).toEqual({ values: [1, 2] });
    expect(watched.result()).toMatchObject({ dataState: 'complete', loading: false, networkStatus: NetworkStatus.ready });
    expect(once.data()).toEqual({ values: [1, 2] });
    watched.terminate();
    once.terminate();
    client.stop();
  });
});
