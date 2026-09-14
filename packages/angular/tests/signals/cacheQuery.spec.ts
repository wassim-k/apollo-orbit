import { computed, inject, Injector, signal } from '@angular/core';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { Apollo, IncompleteCacheError, InMemoryCache, provideApollo, SignalCacheQuery, withApolloOptions } from '@apollo-orbit/angular';
import { ApolloLink, gql, OperationVariables, TypedDocumentNode } from '@apollo/client';
import { MockLink, MockSubscriptionLink } from '@apollo/client/testing';
import { provideApolloMock } from '../helpers/apollo-mock.provider';

interface Value {
  value: string;
}

interface Book {
  id: string;
  name: string;
}

describe('SignalCacheQuery', () => {
  let apollo: Apollo;
  let mockLink: MockLink;
  let mockSubscriptionLink: MockSubscriptionLink;
  let injector: Injector;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideApolloMock()]
    });

    apollo = TestBed.inject(Apollo);
    mockLink = TestBed.inject(MockLink);
    mockSubscriptionLink = TestBed.inject(MockSubscriptionLink);
    injector = TestBed.inject(Injector);
  });

  it('should throw a failed read rather than report it as a cache miss', () => {
    const cacheQuery = apollo.signal.cacheQuery({ query: gql`fragment OnlyAFragment on Book { id }`, injector });

    expect(() => cacheQuery.result()).toThrow('Must contain a query definition.');
  });

  it('should expose the variables it reads the cache with', () => {
    const id = signal('1');

    const cacheQuery = apollo.signal.cacheQuery({
      query: gql`query Book($id: ID!) { book(id: $id) { id } }`,
      variables: () => ({ id: id() }),
      injector
    });

    expect(cacheQuery.variables()).toEqual({ id: '1' });

    id.set('2');

    expect(cacheQuery.variables()).toEqual({ id: '2' });
  });

  it('should not read variables until the result is read', () => {
    const variables = vi.fn(() => ({ id: '1' }));

    apollo.signal.cacheQuery({ query: gql`query Book($id: ID!) { book(id: $id) { id } }`, variables, injector });

    expect(variables).not.toHaveBeenCalled();
  });

  it('should report null data with complete false when the cache holds part of the query', () => {
    apollo.cache.writeQuery({
      query: gql`query { book { id } }`,
      data: { book: { __typename: 'Book', id: '1' } }
    });

    const cacheQuery = apollo.signal.cacheQuery<{ book: Book }>({
      query: gql`query { book { id name } }`,
      injector
    });

    expect(cacheQuery.complete()).toBe(false);
    expect(cacheQuery.data()).toBeNull();
    expect(cacheQuery.missing()).toBeDefined();
  });

  it('should keep partial data when returnPartialData is true', () => {
    apollo.cache.writeQuery({
      query: gql`query { book { id } }`,
      data: { book: { __typename: 'Book', id: '1' } }
    });

    const cacheQuery = apollo.signal.cacheQuery<{ book: Book }, OperationVariables, true>({
      query: gql`query { book { id name } }`,
      returnPartialData: true,
      injector
    });

    expect(cacheQuery.complete()).toBe(false);
    expect(cacheQuery.data()).toEqual({ book: { __typename: 'Book', id: '1' } });
  });

  describe('required', () => {
    it('should enforce required mode and recover when constructed directly', fakeAsync(() => {
      const query: TypedDocumentNode<Value> = gql`query { value }`;
      const optional = new SignalCacheQuery(injector, apollo.cache, { query });
      const required = new SignalCacheQuery(injector, apollo.cache, { query }, true);

      expect(optional.data()).toBeNull();
      expect(() => required.data()).toThrow(IncompleteCacheError);
      tick();

      apollo.cache.writeQuery({ query, data: { value: 'present' } });

      expect(required.data().value).toBe('present');
      expect(required.complete()).toBe(true);
    }));

    // Mirrors a local state field whose type policy always returns a value, so the read cannot be
    // incomplete and callers should reach `data` without narrowing.
    const settingsQuery: TypedDocumentNode<{ settings: { __typename: 'Settings'; theme: string } }> = gql`query { settings { theme } }`;

    const withPolicy = (): { apollo: Apollo; injector: Injector } => {
      const cache = new InMemoryCache({
        typePolicies: {
          Query: { fields: { settings: { read: existing => existing ?? { __typename: 'Settings', theme: 'dark' } } } }
        }
      });

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [provideApollo(withApolloOptions(() => ({ cache, link: ApolloLink.empty() })))]
      });

      return { apollo: TestBed.inject(Apollo), injector: TestBed.inject(Injector) };
    };

    it('should reach data without narrowing on complete', () => {
      const scoped = withPolicy();
      const cacheQuery = scoped.apollo.signal.cacheQuery.required({ query: settingsQuery, injector: scoped.injector });

      expect(cacheQuery.data().settings.theme).toBe('dark');
      expect(cacheQuery.complete()).toBe(true);
    });

    it('should watch the cache like any other cache query', fakeAsync(() => {
      const scoped = withPolicy();
      const cacheQuery = scoped.apollo.signal.cacheQuery.required({ query: settingsQuery, injector: scoped.injector });

      TestBed.tick();
      tick();

      scoped.apollo.cache.writeQuery({ query: settingsQuery, data: { settings: { __typename: 'Settings', theme: 'light' } } });
      tick();

      expect(cacheQuery.data().settings.theme).toBe('light');
    }));

    it('should throw rather than report null data when the assertion does not hold', () => {
      const cacheQuery = apollo.signal.cacheQuery.required<{ book: Book }>({
        query: gql`query { book { id name } }`,
        injector
      });

      expect(() => cacheQuery.result()).toThrow(/required cache query read an incomplete result/);
      expect(() => cacheQuery.data()).toThrow(/required cache query read an incomplete result/);
    });

    it('should recover once the data lands in the cache', fakeAsync(() => {
      const query: TypedDocumentNode<{ book: Book & { __typename: 'Book' } }> = gql`query { book { id name } }`;
      const cacheQuery = apollo.signal.cacheQuery.required({ query, injector });

      expect(() => cacheQuery.result()).toThrow(/incomplete result/);

      TestBed.tick();
      tick();

      apollo.cache.writeQuery({ query, data: { book: { __typename: 'Book', id: '1', name: 'Book 1' } } });
      tick();

      expect(cacheQuery.data().book.name).toBe('Book 1');
    }));

    it('should recover after the data is evicted and written again', fakeAsync(() => {
      const query: TypedDocumentNode<{ value: string }> = gql`query { value }`;
      apollo.cache.writeQuery({ query, data: { value: 'one' } });

      const cacheQuery = apollo.signal.cacheQuery.required({ query, injector });

      tick();

      expect(cacheQuery.data()).toEqual({ value: 'one' });

      apollo.cache.evict({ fieldName: 'value' });

      expect(() => cacheQuery.data()).toThrow(IncompleteCacheError);

      apollo.cache.writeQuery({ query, data: { value: 'two' } });

      expect(cacheQuery.data()).toEqual({ value: 'two' });
    }));
  });

  it('should narrow to fully typed data on complete', () => {
    apollo.cache.writeQuery({
      query: gql`query { book { id name } }`,
      data: { book: { __typename: 'Book', id: '1', name: 'Book 1' } }
    });

    const cacheQuery = apollo.signal.cacheQuery<{ book: Book }>({
      query: gql`query { book { id name } }`,
      injector
    });

    const result = cacheQuery.result();

    if (!result.complete) throw new Error('expected a complete read');

    expect(result.data.book.name).toBe('Book 1');
  });

  it('should not notify again when the subscription repeats the value already read', fakeAsync(() => {
    const query = gql`query { book { id name } }`;

    apollo.cache.writeQuery({
      query,
      data: { book: { __typename: 'Book', id: '1', name: 'Book 1' } }
    });

    const cacheQuery = apollo.signal.cacheQuery({ query, injector });

    let recomputes = 0;
    const watcher = TestBed.runInInjectionContext(() => computed(() => {
      recomputes++;
      return cacheQuery.result();
    }));

    watcher();
    expect(recomputes).toBe(1);

    // Subscribing broadcasts the value already read. `CacheQueryObservable` hands back the same object,
    // so nothing downstream recomputes for a result that never changed.
    tick();
    watcher();

    expect(recomputes).toBe(1);
  }));

  it('should read the cache synchronously on the first read', () => {
    const query = gql`query { book { id name } }`;

    apollo.cache.writeQuery({
      query,
      data: { book: { __typename: 'Book', id: '1', name: 'Book 1' } }
    });

    const cacheQuery = apollo.signal.cacheQuery({ query, injector });

    expect(cacheQuery.data()).toEqual({ book: { __typename: 'Book', id: '1', name: 'Book 1' } });
    expect(cacheQuery.complete()).toBe(true);
  });

  it('should report a cache miss rather than failing', fakeAsync(() => {
    const query = gql`query { missing { id name } }`;

    const cacheQuery = apollo.signal.cacheQuery({ query, injector });

    expect(cacheQuery.data()).toBeNull();
    expect(cacheQuery.complete()).toBe(false);
    expect(cacheQuery.missing()).toBeDefined();

    // The failed read must not poison the signal: once the subscription is live, a write is picked up.
    tick();

    apollo.cache.writeQuery({
      query,
      data: { missing: { __typename: 'Book', id: '2', name: 'Book 2' } }
    });

    tick();

    expect(cacheQuery.data()).toEqual({ missing: { __typename: 'Book', id: '2', name: 'Book 2' } });
    expect(cacheQuery.complete()).toBe(true);
  }));

  it('should observe cache data', fakeAsync(() => {
    const query = gql`query { book { id name } }`;

    apollo.cache.writeQuery({
      query,
      data: {
        book: {
          __typename: 'Book',
          id: '1',
          name: 'Initial Book'
        }
      }
    });

    const cacheQuery = apollo.signal.cacheQuery({
      query,
      injector
    });

    tick();

    expect(cacheQuery.data()).toEqual({
      book: {
        __typename: 'Book',
        id: '1',
        name: 'Initial Book'
      }
    });

    expect(cacheQuery.complete()).toBe(true);

    apollo.cache.writeQuery({
      query,
      data: {
        book: {
          __typename: 'Book',
          id: '1',
          name: 'Updated Book'
        }
      }
    });

    tick();

    expect(cacheQuery.data()).toEqual({
      book: {
        __typename: 'Book',
        id: '1',
        name: 'Updated Book'
      }
    });
  }));

  it('should handle missing fields', fakeAsync(() => {
    const query = gql`query { book { id name author { id } } }`;

    // Add incomplete data to cache
    apollo.cache.writeQuery({
      query: gql`query { book { id name } }`,
      data: {
        book: {
          __typename: 'Book',
          id: '1',
          name: 'Book with missing author'
        }
      }
    });

    const cacheQuery = apollo.signal.cacheQuery({
      query,
      injector
    });

    tick();

    expect(cacheQuery.complete()).toBe(false);
    expect(cacheQuery.data()).toBeNull();
    expect(cacheQuery.missing()).toBeDefined();

    // Complete the data
    apollo.cache.writeQuery({
      query,
      data: {
        book: {
          __typename: 'Book',
          id: '1',
          name: 'Book with missing author',
          author: {
            __typename: 'Author',
            id: 'a1'
          }
        }
      }
    });

    tick();

    expect(cacheQuery.complete()).toBe(true);
    expect(cacheQuery.missing()).toBeUndefined();
  }));

  it('should ignore cache updates for the variables it has moved on from', fakeAsync(() => {
    const keyed: TypedDocumentNode<{ value: string }, { id: string }> = gql`query ($id: ID!) { value(id: $id) }`;
    const id = signal('1');
    const write = (key: string, value: string): void => {
      apollo.cache.writeQuery({ query: keyed, variables: { id: key }, data: { value } });
    };

    write('1', 'one');
    write('2', 'two');

    const cacheQuery = apollo.signal.cacheQuery({ query: keyed, injector, variables: () => ({ id: id() }) });

    tick();

    expect(cacheQuery.data()).toEqual({ value: 'one' });

    id.set('2');

    expect(cacheQuery.data()).toEqual({ value: 'two' });

    write('1', 'old updated');

    expect(cacheQuery.data()).toEqual({ value: 'two' });

    tick();

    expect(cacheQuery.data()).toEqual({ value: 'two' });
  }));
});
