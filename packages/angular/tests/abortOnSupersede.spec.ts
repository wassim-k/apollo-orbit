import { Injector, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Apollo, InMemoryCache, provideApollo, withApolloOptions } from '@apollo-orbit/angular';
import { ApolloLink, gql, Observable as ApolloObservable, TypedDocumentNode } from '@apollo/client';

interface Value {
  value: string;
}

interface LinkLog {
  requested: Array<string>;
  cancelled: Array<string>;
}

const query: TypedDocumentNode<Value, { id: string }> = gql`query GetValue($id: ID!) { value(id: $id) }`;

/**
 * A stand-in for `HttpLink`: it honours `fetchOptions.signal` *and* stops on unsubscribe, so it can tell the
 * two cancellation mechanisms apart. That matters because the link observable is reference-counted - a
 * signal belongs to whoever created the shared operation, an unsubscribe only to the caller doing it.
 */
function cancellableLink(log: LinkLog): ApolloLink {
  return new ApolloLink(operation => new ApolloObservable(observer => {
    const id = operation.variables.id as string;
    const signal = operation.getContext().fetchOptions?.signal as AbortSignal | undefined;
    let settled = false;

    const cancel = (): void => {
      if (settled) return;
      settled = true;
      log.cancelled.push(id);
      clearTimeout(timer);
    };

    const onAbort = (): void => {
      cancel();
      observer.error(new DOMException('The operation was aborted.', 'AbortError'));
    };

    log.requested.push(id);
    signal?.addEventListener('abort', onAbort, { once: true });

    const timer = setTimeout(() => {
      settled = true;
      observer.next({ data: { value: `for-${id}` } });
      observer.complete();
    }, 20);

    return () => {
      cancel();
      signal?.removeEventListener('abort', onAbort);
    };
  }));
}

describe('SignalSingleQuery abort on supersede', () => {
  let apollo: Apollo;
  let injector: Injector;
  let log: LinkLog;

  beforeEach(() => {
    log = { requested: [], cancelled: [] };

    TestBed.configureTestingModule({
      providers: [provideApollo(withApolloOptions(() => ({ cache: new InMemoryCache(), link: cancellableLink(log) })))]
    });

    apollo = TestBed.inject(Apollo);
    injector = TestBed.inject(Injector);
  });

  it('should reject a superseded execution under an errorPolicy of none', async () => {
    const variables = signal({ id: '1' });
    const singleQuery = apollo.signal.query.once({ query, variables, lazy: true, injector });

    const superseded = singleQuery.execute();
    variables.set({ id: '2' });

    await expect(superseded).rejects.toMatchObject({ name: 'AbortError' });
  });

  it('should resolve a superseded execution with the abort error under an errorPolicy of all', async () => {
    const variables = signal({ id: '1' });
    const singleQuery = apollo.signal.query.once({ query, variables, errorPolicy: 'all', lazy: true, injector });

    const superseded = singleQuery.execute();
    variables.set({ id: '2' });

    const result = await superseded;

    expect(result.data).toBeUndefined();
    expect(result.error).toMatchObject({ name: 'AbortError' });
  });

  it('should resolve a superseded execution without an error under an errorPolicy of ignore', async () => {
    const variables = signal({ id: '1' });
    const singleQuery = apollo.signal.query.once({ query, variables, errorPolicy: 'ignore', lazy: true, injector });

    const superseded = singleQuery.execute();
    variables.set({ id: '2' });

    const result = await superseded;

    expect(result.data).toBeUndefined();
    expect(result.error).toBeUndefined();
  });

  it('should abort an execution terminated mid-flight', async () => {
    const singleQuery = apollo.signal.query.once({ query, variables: () => ({ id: '1' }), lazy: true, injector });

    const terminated = singleQuery.execute();
    singleQuery.terminate();

    await expect(terminated).rejects.toMatchObject({ name: 'AbortError' });
    expect(singleQuery.active()).toBe(false);
  });

  // Cancelling a watched query rejects the promise Apollo Client returned, whatever the policy. These are
  // narrowed by that policy, so the cancellation is reported as the result the policy promises instead.
  it('should resolve a terminated refetch under an errorPolicy of all', async () => {
    const watched = apollo.signal.query({ query, variables: () => ({ id: '1' }), errorPolicy: 'all', injector });
    await watched.execute();

    const refetching = watched.refetch();
    watched.terminate();

    const result = await refetching;

    expect(result.data).toBeUndefined();
    expect(result.error).toMatchObject({ name: 'AbortError' });
  });

  it('should resolve a terminated refetch without an error under an errorPolicy of ignore', async () => {
    const watched = apollo.signal.query({ query, variables: () => ({ id: '1' }), errorPolicy: 'ignore', injector });
    await watched.execute();

    const refetching = watched.refetch();
    watched.terminate();

    const result = await refetching;

    expect(result.data).toBeUndefined();
    expect(result.error).toBeUndefined();
  });

  it('should reject a terminated refetch under an errorPolicy of none', async () => {
    const watched = apollo.signal.query({ query, variables: () => ({ id: '1' }), errorPolicy: 'none', injector });
    await watched.execute();

    const refetching = watched.refetch();
    watched.terminate();

    await expect(refetching).rejects.toMatchObject({ name: 'AbortError' });
  });

  it('should cancel the superseded request at the link and leave the newest one to complete', async () => {
    const variables = signal({ id: '1' });
    const singleQuery = apollo.signal.query.once({ query, variables, lazy: true, injector });

    const superseded = singleQuery.execute();
    variables.set({ id: '2' });

    await expect(superseded).rejects.toMatchObject({ name: 'AbortError' });
    await vi.waitFor(() => expect(singleQuery.data()).toEqual({ value: 'for-2' }));

    expect(log.requested).toEqual(['1', '2']);
    expect(log.cancelled).toEqual(['1']);
  });

  // The reason cancellation is an unsubscribe rather than an abort signal: a signal belongs to whoever
  // created the shared operation, so aborting it would fail every caller that joined.
  it('should leave a shared request running for a caller that is still waiting on it', async () => {
    const variables = signal({ id: '1' });
    const singleQuery = apollo.signal.query.once({ query, variables, lazy: true, injector });

    const superseded = singleQuery.execute();
    const joined = apollo.client.query({ query, variables: { id: '1' } });
    variables.set({ id: '2' });

    await expect(superseded).rejects.toMatchObject({ name: 'AbortError' });
    await expect(joined).resolves.toMatchObject({ data: { value: 'for-1' } });
    await vi.waitFor(() => expect(singleQuery.data()).toEqual({ value: 'for-2' }));

    expect(log.cancelled).toEqual([]);
    expect(log.requested).toEqual(['1', '2']);
  });
});
