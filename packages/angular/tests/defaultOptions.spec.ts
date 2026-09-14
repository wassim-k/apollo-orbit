import { Injector, signal } from '@angular/core';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { Apollo, ErrorPolicy, InMemoryCache, provideApollo, withApolloOptions } from '@apollo-orbit/angular';
import { ApolloLink, Observable as ApolloObservable, gql, TypedDocumentNode, WatchQueryFetchPolicy } from '@apollo/client';

interface Value {
  value: string;
}

const query: TypedDocumentNode<Value, { id: string }> = gql`query GetValue($id: ID!) { value(id: $id) }`;

function signalAwareLink(requested: Array<string>): ApolloLink {
  return new ApolloLink(operation => new ApolloObservable(observer => {
    const signal = operation.getContext().fetchOptions?.signal as AbortSignal | undefined;
    const onAbort = (): void => observer.error(new DOMException('The operation was aborted.', 'AbortError'));
    requested.push(operation.variables.id);
    signal?.addEventListener('abort', onAbort, { once: true });

    const timer = setTimeout(() => {
      observer.next(operation.variables.id === 'error'
        ? { errors: [{ message: 'boom' }] }
        : { data: { value: `for-${operation.variables.id}` } });
      observer.complete();
    }, 20);

    return () => {
      clearTimeout(timer);
      signal?.removeEventListener('abort', onAbort);
    };
  }));
}

/**
 * The ambient default `errorPolicy` decides how an operation that produced no result finishes, and the ambient
 * default `fetchPolicy` whether it reaches the link at all. Assigning `client.defaultOptions` is the only way to
 * exercise either here: the constructor option is gated behind an `ApolloClient.DeclareDefaultOptions` declaration,
 * which is global to a TypeScript program and would stop the rest of the suite compiling.
 */
describe('ambient default options', () => {
  let apollo: Apollo;
  let injector: Injector;
  let requested: Array<string>;

  const withDefault = (scope: 'query' | 'watchQuery', options: { errorPolicy?: ErrorPolicy; fetchPolicy?: WatchQueryFetchPolicy }): void => {
    apollo.client.defaultOptions = { ...apollo.client.defaultOptions, [scope]: options };
  };

  beforeEach(() => {
    requested = [];

    TestBed.configureTestingModule({
      providers: [provideApollo(withApolloOptions(() => ({ cache: new InMemoryCache(), link: signalAwareLink(requested) })))]
    });

    apollo = TestBed.inject(Apollo);
    injector = TestBed.inject(Injector);
  });

  describe('cancelled executions', () => {
    it('should not write a cancelled execution into the result signals under a default of all', async () => {
      withDefault('watchQuery', { errorPolicy: 'all' });
      const once = apollo.signal.query.once({ query, variables: () => ({ id: '1' }), lazy: true, injector });

      const superseded = once.execute();
      const current = once.execute({ variables: { id: '2' } });

      // The abort settles first. Under 'all' it resolves rather than rejects, so nothing about the promise
      // marks it as stale - only the generation does.
      await superseded;

      expect(once.error()).toBeUndefined();
      expect(once.loading()).toBe(true);

      await current;

      expect(once.data()).toEqual({ value: 'for-2' });
      expect(once.error()).toBeUndefined();
    });

    it('should not write a cancelled execution after terminate under a default of all', async () => {
      withDefault('watchQuery', { errorPolicy: 'all' });
      const once = apollo.signal.query.once({ query, variables: () => ({ id: '1' }), lazy: true, injector });

      const terminated = once.execute();
      once.terminate();

      await terminated;

      expect(once.error()).toBeUndefined();
      expect(once.data()).toBeUndefined();
    });
  });

  describe('initial loading state', () => {
    it('should not report loading under an ambient standby default', () => {
      withDefault('watchQuery', { fetchPolicy: 'standby' });

      const signalQuery = apollo.signal.query({ query, variables: () => ({ id: '1' }), injector });

      expect(signalQuery.loading()).toBe(false);
    });

    it('should not report loading for a single query under an ambient standby default', () => {
      withDefault('watchQuery', { fetchPolicy: 'standby' });

      const singleQuery = apollo.signal.query.once({ query, variables: () => ({ id: '1' }), injector });

      expect(singleQuery.loading()).toBe(false);
    });

    it('should report loading when an ambient default leaves the query fetching', () => {
      withDefault('watchQuery', { fetchPolicy: 'network-only' });

      const signalQuery = apollo.signal.query({ query, variables: () => ({ id: '1' }), injector });

      expect(signalQuery.loading()).toBe(true);

      signalQuery.terminate();
    });
  });

  describe('signal.query.once', () => {
    it('should reject a skipped execution when no default is declared', async () => {
      const singleQuery = apollo.signal.query.once({ query, variables: () => null, lazy: true, injector });

      await expect(singleQuery.execute()).rejects.toMatchObject({ name: 'AbortError' });
    });

    it('should resolve a skipped execution under a default of all', async () => {
      withDefault('watchQuery', { errorPolicy: 'all' });
      const singleQuery = apollo.signal.query.once({ query, variables: () => null, lazy: true, injector });

      const result = await singleQuery.execute();

      expect(result.data).toBeUndefined();
      expect(result.error).toBeUndefined();
    });

    it('should resolve a skipped execution under a default of ignore', async () => {
      withDefault('watchQuery', { errorPolicy: 'ignore' });
      const singleQuery = apollo.signal.query.once({ query, variables: () => null, lazy: true, injector });

      const result = await singleQuery.execute();

      expect(result.data).toBeUndefined();
    });

    it('should resolve an aborted execution with the error under a default of all', async () => {
      withDefault('watchQuery', { errorPolicy: 'all' });
      const variables = signal<{ id: string } | null>({ id: '1' });
      const singleQuery = apollo.signal.query.once({ query, variables, lazy: true, injector });

      const superseded = singleQuery.execute();
      variables.set({ id: '2' });

      const result = await superseded;

      expect(result.data).toBeUndefined();
      expect(result.error).toMatchObject({ name: 'AbortError' });
    });

    it('should prefer an explicit errorPolicy over the default', async () => {
      withDefault('watchQuery', { errorPolicy: 'all' });
      const singleQuery = apollo.signal.query.once({ query, variables: () => null, errorPolicy: 'none', lazy: true, injector });

      await expect(singleQuery.execute()).rejects.toMatchObject({ name: 'AbortError' });
    });

    // `query.once` is a watched query that resolves once - Apollo Client models its own `useLazyQuery` the
    // same way - so it reads the same defaults slot as `signal.query`, not the `client.query` one.
    it('should read the watchQuery default rather than the query default', async () => {
      withDefault('query', { errorPolicy: 'none' });
      withDefault('watchQuery', { errorPolicy: 'all' });
      const singleQuery = apollo.signal.query.once({ query, variables: () => null, lazy: true, injector });

      const result = await singleQuery.execute();

      expect(result.data).toBeUndefined();
    });
  });

  describe('signal.query.once fetchPolicy', () => {
    beforeEach(() => apollo.cache.writeQuery({ query, variables: { id: '1' }, data: { value: 'cached' } }));

    it('should read the watchQuery default rather than the query default', async () => {
      withDefault('query', { fetchPolicy: 'cache-first' });
      withDefault('watchQuery', { fetchPolicy: 'network-only' });
      const singleQuery = apollo.signal.query.once({ query, variables: () => ({ id: '1' }), lazy: true, injector });

      const result = await singleQuery.execute();

      expect(result.data).toEqual({ value: 'for-1' });
      expect(requested).toEqual(['1']);
    });
  });

  describe('signal.query', () => {
    it('should reject a terminated execution when no default is declared', async () => {
      const watched = apollo.signal.query({ query, variables: () => ({ id: '1' }), lazy: true, injector });

      const terminated = watched.execute();
      watched.terminate();

      await expect(terminated).rejects.toMatchObject({ name: 'AbortError' });
    });

    it('should resolve a terminated execution with the error under a default of all', async () => {
      withDefault('watchQuery', { errorPolicy: 'all' });
      const watched = apollo.signal.query({ query, variables: () => ({ id: '1' }), lazy: true, injector });

      const terminated = watched.execute();
      watched.terminate();

      const result = await terminated;

      expect(result.data).toBeUndefined();
      expect(result.error).toMatchObject({ name: 'AbortError' });
    });

    it('should read the watchQuery default rather than the query default', async () => {
      withDefault('query', { errorPolicy: 'none' });
      withDefault('watchQuery', { errorPolicy: 'all' });
      const watched = apollo.signal.query({ query, variables: () => ({ id: '1' }), lazy: true, injector });

      const terminated = watched.execute();
      watched.terminate();

      const result = await terminated;

      expect(result.error).toMatchObject({ name: 'AbortError' });
    });
  });

  describe('returnPartialData', () => {
    it('should honour a declared watch default and keep one-shot results complete', fakeAsync(() => {
      const document: TypedDocumentNode<{ a: string; b: string }> = gql`query { a b }`;

      // Assigned at runtime: the declared-defaults type only admits what the application declared ambiently.
      apollo.client.defaultOptions.watchQuery = { returnPartialData: true } as typeof apollo.client.defaultOptions.watchQuery;
      apollo.cache.writeQuery({ query: gql`query { a }`, data: { a: 'present' } });

      const watched = apollo.signal.query({ query: document, injector, fetchPolicy: 'cache-only' });
      const once = apollo.signal.query.once({ query: document, injector, fetchPolicy: 'cache-only' });

      tick();

      expect(watched.result().dataState).toBe('partial');
      expect(once.result().dataState).toBe('empty');
      expect(once.data()).toBeUndefined();
    }));
  });
});
