import { AfterViewInit, Component, effect, inject, Injector, input, OnInit, signal } from '@angular/core';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { Apollo, InMemoryCache, provideApollo, SingleQueryResult, withApolloOptions } from '@apollo-orbit/angular';
import { ApolloLink, ErrorLike, gql, NetworkStatus, OperationVariables, TypedDocumentNode, WatchQueryFetchPolicy } from '@apollo/client';
import { MockLink, MockSubscriptionLink } from '@apollo/client/testing';
import { GraphQLError } from 'graphql';
import { provideApolloMock } from '../helpers/apollo-mock.provider';

interface Value {
  value: string;
}

interface Book {
  id: string;
  name: string;
}

describe('SignalQuery', () => {
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

  it('should start a component query after inputs and before a later component effect', () => {
    const events: Array<string> = [];
    const query: TypedDocumentNode<Value, { id: string }> = gql`query Value($id: ID!) { value(id: $id) }`;
    apollo.cache.writeQuery({ query, variables: { id: '1' }, data: { value: 'cached' } });
    const watchQuery = apollo.watchQuery.bind(apollo);
    vi.spyOn(apollo, 'watchQuery').mockImplementation(options => {
      events.push('query effect');
      return watchQuery(options);
    });

    @Component({ selector: 'test-query-lifecycle', template: '{{ query.data()?.value }}' })
    class QueryComponent implements OnInit, AfterViewInit {
      public readonly id = input.required<string>();
      public readonly query = inject(Apollo).signal.query({ query, variables: () => ({ id: this.id() }) });

      public constructor() {
        events.push('query created');
        effect(() => {
          events.push(`component effect: ${this.query.active()}`);
        });
      }

      public ngOnInit(): void {
        events.push(`ngOnInit: ${this.id()}`);
      }

      public ngAfterViewInit(): void {
        events.push('view initialized');
      }
    }

    @Component({ imports: [QueryComponent], template: '<test-query-lifecycle id="1" />' })
    class Host { }

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();

    expect(events).toEqual([
      'query created',
      'ngOnInit: 1',
      'query effect',
      'component effect: true',
      'view initialized'
    ]);
    expect(fixture.nativeElement.textContent).toBe('cached');
    fixture.destroy();
  });

  it('should create a signal query and update with results', fakeAsync(() => {
    const query: TypedDocumentNode<Value> = gql`query { value }`;
    mockLink.addMockedResponse({
      request: { query },
      result: { data: { value: 'expected' } },
      delay: 10
    });

    const signalQuery = apollo.signal.query({
      query,
      injector
    });

    expect(signalQuery.loading()).toBe(true);
    expect(signalQuery.data()).toBeUndefined();
    expect(signalQuery.error()).toBeUndefined();
    expect(signalQuery.networkStatus()).toBe(NetworkStatus.loading);

    tick(0);

    expect(signalQuery.loading()).toBe(true);
    expect(signalQuery.data()).toBeUndefined();
    expect(signalQuery.error()).toBeUndefined();
    expect(signalQuery.networkStatus()).toBe(NetworkStatus.loading);

    tick(10);

    expect(signalQuery.loading()).toBe(false);
    expect(signalQuery.data()).toEqual({ value: 'expected' });
    expect(signalQuery.error()).toBeUndefined();
    expect(signalQuery.networkStatus()).toBe(NetworkStatus.ready);
  }));

  it.each([true, false])('should preserve previousData across cache hits with notifyOnNetworkStatusChange: %s', notifyOnNetworkStatusChange => {
    fakeAsync(() => {
      const query: TypedDocumentNode<Value, { id: string }> = gql`query Value($id: ID!) { value(id: $id) }`;
      for (const id of ['1', '2']) apollo.cache.writeQuery({ query, variables: { id }, data: { value: id } });
      const signalQuery = apollo.signal.query({ query, variables: () => ({ id: '1' }), injector, lazy: true, notifyOnNetworkStatusChange });

      void signalQuery.execute();
      tick();
      expect(signalQuery.previousData()).toBeUndefined();

      void signalQuery.execute({ variables: { id: '2' } });
      tick();
      expect(signalQuery.data()).toEqual({ value: '2' });
      expect(signalQuery.previousData()).toEqual({ value: '1' });
    })();
  });

  it('should refetch query and update signals', fakeAsync(() => {
    const query: TypedDocumentNode<Value> = gql`query { value }`;

    mockLink.addMockedResponse({
      request: { query },
      result: { data: { value: 'initial' } }
    });

    mockLink.addMockedResponse({
      request: { query },
      result: { data: { value: 'updated' } },
      delay: 5
    });

    const signalQuery = apollo.signal.query({
      query,
      injector
    });

    tick();
    expect(signalQuery.data()).toEqual({ value: 'initial' });
    expect(signalQuery.previousData()).toBeUndefined();

    signalQuery.refetch();

    expect(signalQuery.loading()).toBe(true);
    expect(signalQuery.networkStatus()).toBe(NetworkStatus.refetch);
    expect(signalQuery.previousData()).toEqual({ value: 'initial' });

    tick(5);

    expect(signalQuery.loading()).toBe(false);
    expect(signalQuery.data()).toEqual({ value: 'updated' });
    expect(signalQuery.previousData()).toEqual({ value: 'initial' });
  }));

  it('should handle errors and update error signal', fakeAsync(() => {
    const query: TypedDocumentNode<Value> = gql`query { value }`;
    mockLink.addMockedResponse({
      request: { query },
      result: { errors: [new GraphQLError('Query error')] }
    });

    const signalQuery = apollo.signal.query({
      query,
      injector
    });

    tick();

    expect(signalQuery.loading()).toBe(false);
    expect(signalQuery.data()).toBeUndefined();
    expect(signalQuery.error()).toBeDefined();
    expect(signalQuery.error()?.message).toContain('Query error');
    expect(signalQuery.networkStatus()).toBe(NetworkStatus.error);
  }));

  it('should update query when variables function returns different value', fakeAsync(() => {
    const id = '1';
    const query = gql`query GetValue($id: ID!) { value(id: $id) }`;

    // First request with id=1
    mockLink.addMockedResponse({
      request: { query, variables: { id: '1' } },
      result: { data: { value: 'value-1' } }
    });

    // Second request with id=2
    mockLink.addMockedResponse({
      request: { query, variables: { id: '2' } },
      result: { data: { value: 'value-2' } }
    });

    const variables = signal(({ id }));

    const signalQuery = apollo.signal.query({
      query,
      variables,
      injector
    });

    tick();
    expect(signalQuery.data()).toEqual({ value: 'value-1' });

    variables.set({ id: '2' });
    tick();

    expect(signalQuery.data()).toEqual({ value: 'value-2' });
  }));

  it('should keep variables signal in sync with execute options variables', fakeAsync(() => {
    const id = '1';
    const query = gql`query GetValue($id: ID!) { value(id: $id) }`;

    // First request with id=1
    mockLink.addMockedResponse({
      request: { query, variables: { id: '1' } },
      result: { data: { value: 'value-1' } }
    });

    // Second request with id=2
    mockLink.addMockedResponse({
      request: { query, variables: { id: '2' } },
      result: { data: { value: 'value-2' } }
    });

    const variables = signal(({ id }));

    const signalQuery = apollo.signal.query({
      query,
      variables,
      injector
    });

    tick();
    expect(signalQuery.data()).toEqual({ value: 'value-1' });

    signalQuery.execute({ variables: { id: '2' } });
    tick();

    expect(signalQuery.variables()).toEqual({ id: '2' });
    expect(signalQuery.data()).toEqual({ value: 'value-2' });
  }));

  it('should execute once with a variables function that reads nothing reactive', fakeAsync(() => {
    const query: TypedDocumentNode<Value, { id: string }> = gql`query GetValue($id: ID!) { value(id: $id) }`;

    mockLink.addMockedResponse({
      request: { query, variables: () => true },
      result: { data: { value: 'value-1' } },
      maxUsageCount: Number.POSITIVE_INFINITY
    });

    const requestedVariables: Array<OperationVariables> = [];
    const request = mockLink.request.bind(mockLink);
    mockLink.request = operation => {
      requestedVariables.push(operation.variables);
      return request(operation);
    };

    const signalQuery = apollo.signal.query({ query, variables: () => ({ id: '1' }), injector });

    tick();

    expect(signalQuery.variables()).toEqual({ id: '1' });
    expect(signalQuery.data()).toEqual({ value: 'value-1' });

    TestBed.tick();
    tick();

    expect(requestedVariables).toEqual([{ id: '1' }]);
  }));

  it('should keep variables signal in sync with refetch variables', fakeAsync(() => {
    const id = '1';
    const query = gql`query GetValue($id: ID!) { value(id: $id) }`;

    mockLink.addMockedResponse({
      request: { query, variables: { id: '1' } },
      result: { data: { value: 'value-1' } }
    });

    mockLink.addMockedResponse({
      request: { query, variables: { id: '2' } },
      result: { data: { value: 'value-2' } }
    });

    const variables = signal(({ id }));

    const signalQuery = apollo.signal.query({
      query,
      variables,
      injector
    });

    tick();
    expect(signalQuery.data()).toEqual({ value: 'value-1' });

    signalQuery.refetch({ id: '2' });

    expect(signalQuery.variables()).toEqual({ id: '2' });

    tick();

    expect(signalQuery.variables()).toEqual({ id: '2' });
    expect(signalQuery.data()).toEqual({ value: 'value-2' });
    expect(signalQuery.error()).toBeUndefined();
    expect(signalQuery.networkStatus()).toBe(NetworkStatus.ready);
  }));

  it('should write back the merged and defaulted variables a refetch runs with', fakeAsync(() => {
    const query = gql`query GetValue($id: ID!, $upper: Boolean = false) { value(id: $id, upper: $upper) }`;

    for (const id of ['1', '2']) {
      mockLink.addMockedResponse({
        request: { query, variables: { id, upper: false } },
        result: { data: { value: `value-${id}` } }
      });
    }

    const signalQuery = apollo.signal.query({ query, variables: () => ({ id: '1' }), injector });

    tick();

    signalQuery.refetch({ id: '2' });
    tick();

    // The partial is merged over the current variables and the document default filled in, so the signal
    // describes what the query is running with rather than what the caller passed.
    expect(signalQuery.variables()).toEqual({ id: '2', upper: false });
    expect(signalQuery.data()).toEqual({ value: 'value-2' });
  }));

  it('should leave the variables signal untouched when refetch is called without variables', fakeAsync(() => {
    const query = gql`query GetValue($id: ID!, $upper: Boolean = false) { value(id: $id, upper: $upper) }`;

    mockLink.addMockedResponse({
      request: { query, variables: { id: '1', upper: false } },
      result: { data: { value: 'value-1' } }
    });

    mockLink.addMockedResponse({
      request: { query, variables: { id: '1', upper: false } },
      result: { data: { value: 'value-1-again' } }
    });

    const variables = signal({ id: '1' });

    const signalQuery = apollo.signal.query({ query, variables, injector });

    tick();

    const before = signalQuery.variables();

    signalQuery.refetch();
    tick();

    expect(signalQuery.variables()).toBe(before);
    expect(signalQuery.data()).toEqual({ value: 'value-1-again' });
  }));

  it('should let the variables function override variables written back by refetch', fakeAsync(() => {
    const query = gql`query GetValue($id: ID!) { value(id: $id) }`;

    for (const id of ['1', '2', '3']) {
      mockLink.addMockedResponse({
        request: { query, variables: { id } },
        result: { data: { value: `value-${id}` } }
      });
    }

    const variables = signal({ id: '1' });

    const signalQuery = apollo.signal.query({ query, variables, injector });

    tick();
    expect(signalQuery.data()).toEqual({ value: 'value-1' });

    signalQuery.refetch({ id: '2' });
    tick();

    expect(signalQuery.variables()).toEqual({ id: '2' });

    variables.set({ id: '3' });
    tick();

    expect(signalQuery.variables()).toEqual({ id: '3' });
    expect(signalQuery.data()).toEqual({ value: 'value-3' });
  }));

  for (const notifyOnNetworkStatusChange of [true, false]) {
    it(`notifyOnNetworkStatusChange: ${notifyOnNetworkStatusChange}`, fakeAsync(() => {
      const query: TypedDocumentNode<Value> = gql`query { value }`;
      mockLink.addMockedResponse({
        request: { query },
        result: { data: { value: 'test' } },
        delay: 10
      });

      const signalQuery = apollo.signal.query({ injector, query, notifyOnNetworkStatusChange });

      tick(0);

      expect(signalQuery.loading()).toBe(true);

      tick(10);

      expect(signalQuery.loading()).toBe(false);
      expect(signalQuery.data()).toEqual({ value: 'test' });
    }));
  }

  it('should call updateQuery on active query', fakeAsync(() => {
    const query: TypedDocumentNode<Value> = gql`query { value }`;
    mockLink.addMockedResponse({
      request: { query },
      result: { data: { value: 'initial' } }
    });

    const signalQuery = apollo.signal.query({
      query,
      injector
    });

    tick();
    expect(signalQuery.data()).toEqual({ value: 'initial' });

    signalQuery.updateQuery(() => ({ value: 'updated' }));
    tick();
    expect(signalQuery.data()).toEqual({ value: 'updated' });
  }));

  it('should call startPolling and stopPolling on active query', fakeAsync(() => {
    const query: TypedDocumentNode<Value> = gql`query { value }`;
    mockLink.addMockedResponse({
      request: { query },
      result: { data: { value: 'test' } }
    });

    const signalQuery = apollo.signal.query({
      query,
      injector
    });

    tick();

    signalQuery.startPolling(1000);
    signalQuery.stopPolling();

    // Verifies methods execute without errors
    expect(signalQuery.data()).toEqual({ value: 'test' });
  }));

  it('should call subscribeToMore on active query', fakeAsync(() => {
    const query: TypedDocumentNode<Value> = gql`query { value }`;
    const subscription = gql`subscription { valueChanged }`;

    mockLink.addMockedResponse({
      request: { query },
      result: { data: { value: 'initial' } }
    });

    const signalQuery = apollo.signal.query({
      query,
      injector
    });

    tick();

    const unsubscribe = signalQuery.subscribeToMore({
      subscription,
      updateQuery: prev => prev as Value
    });

    tick();

    // Cleanup
    unsubscribe();

    expect(signalQuery.data()).toBeDefined();
  }));

  it('should support fetchMore', fakeAsync(() => {
    interface BooksData {
      books: Array<{ id: string }>;
    }

    const query: TypedDocumentNode<BooksData> = gql`query GetBooks($offset: Int) { books(offset: $offset) { id } }`;

    mockLink.addMockedResponse({
      request: { query, variables: { offset: 0 } },
      result: { data: { books: [{ id: '1' }] } }
    });

    const signalQuery = apollo.signal.query({
      query,
      variables: () => ({ offset: 0 }),
      injector
    });

    tick();
    expect(signalQuery.data()).toEqual({ books: [{ id: '1' }] });

    mockLink.addMockedResponse({
      request: { query, variables: { offset: 1 } },
      result: { data: { books: [{ id: '2' }] } }
    });

    let result: SingleQueryResult<BooksData> = { data: undefined };

    signalQuery
      .fetchMore({
        variables: { offset: 1 },
        updateQuery: (prev, { fetchMoreResult }) => ({
          books: [...prev.books, ...fetchMoreResult.books]
        })
      })
      .then(r => void (result = r));

    tick();
    expect(signalQuery.data()).toEqual({ books: [{ id: '1' }, { id: '2' }] });
    expect(result.data).toEqual({ books: [{ id: '2' }] });

    mockLink.addMockedResponse({
      request: { query, variables: { offset: 2 } },
      result: { data: { books: [{ id: '2' }] } },
      error: new Error('Network error')
    });

    let fetchMoreError: unknown;

    signalQuery
      .fetchMore({
        variables: { offset: 2 },
        updateQuery: (prev, { fetchMoreResult }) => ({
          books: [...prev.books, ...fetchMoreResult.books]
        })
      })
      .catch((error: unknown) => void (fetchMoreError = error));

    tick();
    expect(signalQuery.data()).toEqual({ books: [{ id: '1' }, { id: '2' }] });
    expect(fetchMoreError).toEqual(new Error('Network error'));
    // The successful fetchMore result is untouched by the failed one.
    expect(result.data).toEqual({ books: [{ id: '2' }] });

    // Fetching a page is additive, so a failed one does not invalidate the query or the pages already loaded.
    expect(signalQuery.error()).toBeUndefined();
    expect(signalQuery.networkStatus()).toBe(NetworkStatus.ready);
    expect(signalQuery.loading()).toBe(false);

    mockLink.addMockedResponse({
      request: { query, variables: { offset: 3 } },
      result: { data: { books: [{ id: '3' }] } }
    });

    signalQuery.fetchMore({
      variables: { offset: 3 },
      updateQuery: (prev, { fetchMoreResult }) => ({
        books: [...prev.books, ...fetchMoreResult.books]
      })
    });

    tick();

    expect(signalQuery.error()).toBeUndefined();
    expect(signalQuery.networkStatus()).toBe(NetworkStatus.ready);
    expect(signalQuery.data()).toEqual({ books: [{ id: '1' }, { id: '2' }, { id: '3' }] });
  }));

  describe('lazy', () => {
    it('should not execute query until explicitly called', fakeAsync(() => {
      const query: TypedDocumentNode<Value> = gql`query { value }`;
      mockLink.addMockedResponse({
        request: { query },
        result: { data: { value: 'expected' } }
      });

      const lazyQuery = apollo.signal.query({ injector, query, lazy: true });

      tick();

      expect(lazyQuery.loading()).toBe(false);
      expect(lazyQuery.data()).toBeUndefined();
      expect(lazyQuery.active()).toBe(false);

      // No requests should have been made
      expect(mockLink.operation).toBeUndefined();

      lazyQuery.execute();
      tick();

      expect(lazyQuery.loading()).toBe(false);
      expect(lazyQuery.data()).toEqual({ value: 'expected' });
      expect(lazyQuery.active()).toBe(true);
      expect(mockLink.operation).toBeDefined();
    }));

    it('should support returning success result from execute', async () => {
      const query: TypedDocumentNode<Value> = gql`query { value }`;

      mockLink.addMockedResponse({
        request: { query },
        result: { data: { value: 'expected' } }
      });

      const lazyQuery = apollo.signal.query({ injector, query, lazy: true });
      expect(lazyQuery.active()).toBe(false);

      const result = await lazyQuery.execute();

      expect(lazyQuery.loading()).toBe(false);
      expect(lazyQuery.data()).toEqual({ value: 'expected' });
      expect(lazyQuery.active()).toBe(true);
      expect(result.data).toEqual({ value: 'expected' });
    });

    it('should reject on query error with an errorPolicy of none', async () => {
      const query: TypedDocumentNode<Value> = gql`query { value }`;

      mockLink.addMockedResponse({
        request: { query },
        error: new TypeError('Failed to fetch')
      });

      const lazyQuery = apollo.signal.query({ injector, query, errorPolicy: 'none', lazy: true });
      expect(lazyQuery.active()).toBe(false);

      await expect(lazyQuery.execute()).rejects.toThrow('Failed to fetch');

      expect(lazyQuery.loading()).toBe(false);
      expect(lazyQuery.data()).toBeUndefined();
      expect(lazyQuery.active()).toBe(true);
      expect(lazyQuery.error()).toEqual(new TypeError('Failed to fetch'));

      mockLink.addMockedResponse({
        request: { query },
        error: new TypeError('Failed to fetch again')
      });

      await expect(lazyQuery.refetch()).rejects.toThrow('Failed to fetch again');

      expect(lazyQuery.error()).toEqual(new TypeError('Failed to fetch again'));
    });

    it('should resolve with the error on query error with an errorPolicy of all', async () => {
      const query: TypedDocumentNode<Value> = gql`query { value }`;

      mockLink.addMockedResponse({
        request: { query },
        error: new TypeError('Failed to fetch')
      });

      const lazyQuery = apollo.signal.query({ injector, query, errorPolicy: 'all', lazy: true });

      // Under `all` the failure arrives as a result rather than an error notification, so the promise resolves.
      let result = await lazyQuery.execute();

      expect(result.data).toBeUndefined();
      expect(result.error).toEqual(new TypeError('Failed to fetch'));
      expect(lazyQuery.loading()).toBe(false);
      expect(lazyQuery.active()).toBe(true);
      expect(lazyQuery.error()).toEqual(new TypeError('Failed to fetch'));

      mockLink.addMockedResponse({
        request: { query },
        error: new TypeError('Failed to fetch again')
      });

      result = await lazyQuery.refetch();

      expect(result.data).toBeUndefined();
      expect(result.error).toEqual(new TypeError('Failed to fetch again'));
      expect(lazyQuery.error()).toEqual(new TypeError('Failed to fetch again'));
    });

    it('should reject from execute on query error while recording it in the signals', async () => {
      const query: TypedDocumentNode<Value> = gql`query { value }`;

      mockLink.addMockedResponse({
        request: { query },
        result: { errors: [new GraphQLError('Query error')] }
      });

      const lazyQuery = apollo.signal.query({ injector, query, lazy: true });
      expect(lazyQuery.active()).toBe(false);

      await expect(lazyQuery.execute()).rejects.toThrow('Query error');

      expect(lazyQuery.loading()).toBe(false);
      expect(lazyQuery.active()).toBe(true);
      expect(lazyQuery.error()?.message).toEqual('Query error');
    });

    it('should record the error when a failing execution is ignored', async () => {
      const query: TypedDocumentNode<Value> = gql`query { value }`;

      mockLink.addMockedResponse({
        request: { query },
        error: new TypeError('Failed to fetch')
      });

      const lazyQuery = apollo.signal.query({ injector, query, lazy: true });

      lazyQuery.execute();

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(lazyQuery.error()).toEqual(new TypeError('Failed to fetch'));
    });

    it('should throw when methods are called before execution', () => {
      const query: TypedDocumentNode<Value> = gql`query { value }`;
      const lazyQuery = apollo.signal.query({ injector, query, lazy: true });

      expect(() => lazyQuery.refetch()).toThrow(/cannot be called while the query is not active/);
      expect(() => lazyQuery.fetchMore({})).toThrow(/cannot be called while the query is not active/);
      expect(() => lazyQuery.updateQuery(() => ({} as Value))).toThrow(/cannot be called while the query is not active/);
      expect(() => lazyQuery.startPolling(1000)).toThrow(/cannot be called while the query is not active/);
      expect(() => lazyQuery.stopPolling()).toThrow(/cannot be called while the query is not active/);
      expect(() => lazyQuery.subscribeToMore({ subscription: gql`subscription { newValue }` })).toThrow(/cannot be called while the query is not active/);
    });

    it('should execute query with different variables', fakeAsync(() => {
      const query = gql`query GetValue($id: ID!) { value(id: $id) }`;

      mockLink.addMockedResponse({
        request: { query, variables: { id: '1' } },
        result: { data: { value: 'value-1' } }
      });

      mockLink.addMockedResponse({
        request: { query, variables: { id: '2' } },
        result: { data: { value: 'value-2' } }
      });

      const lazyQuery = apollo.signal.query({
        query,
        lazy: true,
        variables: () => ({ id: '1' }),
        injector
      });

      lazyQuery.execute();
      tick();
      expect(lazyQuery.data()).toEqual({ value: 'value-1' });

      lazyQuery.execute({ variables: { id: '2' } }).then(result => {
        expect(result.data).toEqual({ value: 'value-2' });
      });

      tick();

      expect(lazyQuery.data()).toEqual({ value: 'value-2' });
    }));

    it('should allow resetting variables to empty object', fakeAsync(() => {
      const query = gql`query GetBooks($limit: Int) { 
        books(limit: $limit) { id name } 
      }`;

      mockLink.addMockedResponse({
        request: { query, variables: { limit: 1 } },
        result: { data: { books: [{ id: '1', name: 'Book 1' }] } }
      });

      mockLink.addMockedResponse({
        request: { query },
        result: { data: { books: [{ id: '1', name: 'Book 1' }, { id: '2', name: 'Book 2' }] } }
      });

      const lazyQuery = apollo.signal.query({
        query,
        lazy: true,
        variables: () => ({ limit: 1 }),
        injector
      });

      lazyQuery.execute();
      tick();
      expect(lazyQuery.data()).toEqual({ books: [{ id: '1', name: 'Book 1' }] });

      lazyQuery.execute({ variables: undefined });
      tick();

      expect(lazyQuery.data()).toEqual({
        books: [
          { id: '1', name: 'Book 1' },
          { id: '2', name: 'Book 2' }
        ]
      });
    }));

    for (const notifyOnNetworkStatusChange of [true, false]) {
      it(`notifyOnNetworkStatusChange: ${notifyOnNetworkStatusChange}`, fakeAsync(() => {
        const query: TypedDocumentNode<Value> = gql`query { value }`;
        mockLink.addMockedResponse({
          request: { query },
          result: { data: { value: 'test' } },
          delay: 10
        });

        const lazyQuery = apollo.signal.query({ injector, query, notifyOnNetworkStatusChange, lazy: true });

        expect(lazyQuery.loading()).toBe(false);

        lazyQuery.execute();

        expect(lazyQuery.loading()).toBe(true);

        tick(10);

        expect(lazyQuery.loading()).toBe(false);
        expect(lazyQuery.data()).toEqual({ value: 'test' });
      }));
    }
  });

  describe('variables nullability', () => {
    it('should not execute query until variables are non-null', fakeAsync(() => {
      const query = gql`query GetBook($id: Int!) { 
        book(id: $id) { id name } 
      }`;

      mockLink.addMockedResponse({
        request: { query, variables: { id: 1 } },
        result: { data: { book: { id: 1, name: 'Book 1' } } }
      });

      // Start with null variables
      const id = signal<number | null>(null);

      const signalQuery = apollo.signal.query({
        query,
        variables: () => id() !== null ? ({ id: id() }) : null,
        injector
      });

      // Query should remain in initial empty state when variables are null
      expect(signalQuery.result()).toEqual({ data: undefined, dataState: 'empty', loading: false, networkStatus: NetworkStatus.ready });
      tick();
      expect(signalQuery.result()).toEqual({ data: undefined, dataState: 'empty', loading: false, networkStatus: NetworkStatus.ready });

      // When variables become non-null, query should execute automatically
      id.set(1);
      tick();

      expect(signalQuery.data()).toEqual({
        book: { id: 1, name: 'Book 1' }
      });
    }));

    it('should terminate query when variables are null', fakeAsync(() => {
      const query = gql`query GetBook($id: Int!) { 
        book(id: $id) { id name } 
      }`;

      mockLink.addMockedResponse({
        request: { query, variables: { id: 1 } },
        result: { data: { book: { id: 1, name: 'Book 1' } } }
      });

      // Start with non-null variables
      const id = signal<number | null>(1);

      const signalQuery = apollo.signal.query({
        query,
        variables: () => id() !== null ? ({ id: id() }) : null,
        injector
      });

      // Query should execute immediately with non-null variables
      expect(signalQuery.result()).toEqual({ data: undefined, dataState: 'empty', loading: true, networkStatus: NetworkStatus.loading });
      tick();
      expect(signalQuery.data()).toEqual({ book: { id: 1, name: 'Book 1' } });

      // Cache updates should be reflected while query is active
      apollo.cache.writeQuery({ query, data: { book: { id: 1, name: 'Book 1 v2' } }, variables: { id: 1 } });
      tick();
      expect(signalQuery.data()).toEqual({ book: { id: 1, name: 'Book 1 v2' } });

      // Setting variables to null should terminate the query and reset data
      id.set(null);
      tick();

      expect(signalQuery.data()).toBeUndefined();
      expect(signalQuery.previousData()).toEqual({ book: { id: 1, name: 'Book 1 v2' } });

      // Cache updates should NOT be reflected after query is terminated
      apollo.cache.writeQuery({ query, data: { book: { id: 1, name: 'Book 1 v3' } }, variables: { id: 1 } });
      tick();
      expect(signalQuery.data()).toBeUndefined();

      // When variables become non-null again, query should restart and get latest cache data
      id.set(1);
      tick();
      expect(signalQuery.data()).toEqual({ book: { id: 1, name: 'Book 1 v3' } });
    }));

    it('should support variables nullability with manual execution/termination', fakeAsync(() => {
      const query = gql`query GetBook($id: Int!) { 
        book(id: $id) { id name } 
      }`;

      mockLink.addMockedResponse({
        request: { query, variables: { id: 1 } },
        result: { data: { book: { id: 1, name: 'Book 1' } } }
      });

      // Start with non-null variables
      const id = signal<number | null>(1);

      const signalQuery = apollo.signal.query({
        query,
        variables: () => id() !== null ? ({ id: id() }) : null,
        injector
      });

      // Query executes automatically with non-null variables
      tick();
      expect(signalQuery.data()).toEqual({ book: { id: 1, name: 'Book 1' } });

      // Manual termination stops the query and resets data
      signalQuery.terminate();

      expect(signalQuery.data()).toBeUndefined();
      expect(signalQuery.previousData()).toEqual({ book: { id: 1, name: 'Book 1' } });

      // Changing variables while terminated has no effect
      id.set(null);
      tick();

      id.set(2);
      tick();
      // Data remains undefined while terminated
      expect(signalQuery.data()).toBeUndefined();
      expect(signalQuery.previousData()).toEqual({ book: { id: 1, name: 'Book 1' } });

      mockLink.addMockedResponse({
        request: { query, variables: { id: 2 } },
        result: { data: { book: { id: 2, name: 'Book 2' } } }
      });

      // Manual execution restarts the query with current variables
      signalQuery.execute();
      tick();
      expect(signalQuery.data()).toEqual({ book: { id: 2, name: 'Book 2' } });
      // previousData is tracked by the query itself, so it survives the termination cycle
      expect(signalQuery.previousData()).toEqual({ book: { id: 1, name: 'Book 1' } });

      mockLink.addMockedResponse({
        request: { query, variables: { id: 3 } },
        result: { data: { book: { id: 3, name: 'Book 3' } } }
      });

      // After manual execution, query responds to variable changes again
      id.set(3);
      tick();
      expect(signalQuery.data()).toEqual({ book: { id: 3, name: 'Book 3' } });
    }));

    it('should not request the previous variables when re-executed after termination', fakeAsync(() => {
      const query = gql`query GetBook($id: Int!) { 
        book(id: $id) { id name } 
      }`;

      mockLink.addMockedResponse({
        request: { query, variables: () => true },
        result: ({ id }) => ({ data: { book: { id, name: `Book ${id}` } } }),
        maxUsageCount: Number.POSITIVE_INFINITY
      });

      // Collected from the link rather than from the mocked response, which only sees the requests it
      // serves: a request that is superseded before it delivers a result never reaches the response.
      const requestedVariables: Array<OperationVariables> = [];
      const request = mockLink.request.bind(mockLink);
      mockLink.request = operation => {
        requestedVariables.push(operation.variables);
        return request(operation);
      };

      const id = signal<number | null>(1);

      const signalQuery = apollo.signal.query({
        query,
        variables: () => id() !== null ? ({ id: id() }) : null,
        fetchPolicy: 'network-only',
        injector
      });

      tick();
      expect(signalQuery.data()).toEqual({ book: { id: 1, name: 'Book 1' } });

      // Null variables terminate the query and discard the observable, so the next execution starts a fresh one.
      id.set(null);
      tick();

      id.set(2);
      tick();

      expect(signalQuery.data()).toEqual({ book: { id: 2, name: 'Book 2' } });
      expect(requestedVariables).toEqual([{ id: 1 }, { id: 2 }]);
    }));

    it('should apply the execution context when re-executed after termination', fakeAsync(() => {
      const query = gql`query GetBook($id: Int!) {
        book(id: $id) { id name }
      }`;

      mockLink.addMockedResponse({
        request: { query, variables: () => true },
        result: ({ id }) => ({ data: { book: { id, name: `Book ${id}` } } }),
        maxUsageCount: Number.POSITIVE_INFINITY
      });

      const requestedContexts: Array<unknown> = [];
      const request = mockLink.request.bind(mockLink);
      mockLink.request = operation => {
        requestedContexts.push(operation.getContext().tag);
        return request(operation);
      };

      const signalQuery = apollo.signal.query({
        query,
        variables: () => ({ id: 1 }),
        fetchPolicy: 'network-only',
        context: { tag: 'initial' },
        injector
      });

      tick();

      signalQuery.terminate();

      // The next execution starts a fresh observable, so its options are the ones the request is made with
      signalQuery.execute({ context: { tag: 'second' } });
      tick();

      expect(requestedContexts).toEqual(['initial', 'second']);
    }));

    it('should handle variables nullability with lazy query', fakeAsync(() => {
      const query = gql`query GetBook($id: Int!) { 
        book(id: $id) { id name } 
      }`;

      const id = signal<number | null>(null);

      const lazyQuery = apollo.signal.query({
        query,
        lazy: true,
        variables: () => id() !== null ? ({ id: id() }) : null,
        injector
      });

      // Should not start query when lazy and variables are null
      tick();
      expect(lazyQuery.active()).toBe(false);
      expect(mockLink.operation).toBeUndefined();

      // Set variables to non-null - should still not start (lazy)
      id.set(1);
      tick();
      expect(lazyQuery.active()).toBe(false);
      expect(mockLink.operation).toBeUndefined();

      // Manually execute
      mockLink.addMockedResponse({
        request: { query, variables: { id: 1 } },
        result: { data: { book: { id: 1, name: 'Book 1' } } }
      });

      lazyQuery.execute();
      tick();
      expect(lazyQuery.active()).toBe(true);
      expect(lazyQuery.data()).toEqual({ book: { id: 1, name: 'Book 1' } });

      // Variables become null - should terminate and reset data
      id.set(null);
      tick();
      expect(lazyQuery.active()).toBe(false);
      expect(lazyQuery.data()).toBeUndefined();
      expect(lazyQuery.previousData()).toEqual({ book: { id: 1, name: 'Book 1' } });

      // Variables become non-null again - should restart (since execute was called manually and intentionally)
      mockLink.addMockedResponse({
        request: { query, variables: { id: 2 } },
        result: { data: { book: { id: 2, name: 'Book 2' } } }
      });

      id.set(2);
      tick();
      expect(lazyQuery.active()).toBe(true);
      expect(lazyQuery.data()).toEqual({ book: { id: 2, name: 'Book 2' } });

      // Test that cache updates are received while active
      apollo.cache.writeQuery({
        query,
        variables: { id: 2 },
        data: { book: { id: 2, name: 'Book 2 Updated' } }
      });
      tick();
      expect(lazyQuery.data()).toEqual({ book: { id: 2, name: 'Book 2 Updated' } });

      // Variables become null again - should terminate and reset data
      id.set(null);
      tick();
      expect(lazyQuery.active()).toBe(false);
      expect(lazyQuery.data()).toBeUndefined();
      expect(lazyQuery.previousData()).toEqual({ book: { id: 2, name: 'Book 2 Updated' } });

      // Cache updates should not affect the query while terminated
      apollo.cache.writeQuery({
        query,
        variables: { id: 2 },
        data: { book: { id: 2, name: 'Book 2 Updated Again' } }
      });
      tick();
      expect(lazyQuery.data()).toBeUndefined();

      // Manually terminate
      lazyQuery.terminate();

      // Variables become non-null - should NOT restart (manually terminated)
      id.set(3);
      tick();
      expect(lazyQuery.active()).toBe(false);

      // Manual execution should work again
      mockLink.addMockedResponse({
        request: { query, variables: { id: 3 } },
        result: { data: { book: { id: 3, name: 'Book 3' } } }
      });

      lazyQuery.execute();
      tick();
      expect(lazyQuery.active()).toBe(true);
      expect(lazyQuery.data()).toEqual({ book: { id: 3, name: 'Book 3' } });
    }));

    it('should follow the error policy when execute is called with null variables', fakeAsync(() => {
      const query = gql`query GetBook($id: Int!) { book(id: $id) { id name } }`;

      mockLink.addMockedResponse({
        request: { query, variables: { id: 1 } },
        result: { data: { book: { id: 1, name: 'Book 1' } } }
      });

      const id = signal<number | null>(1);

      const signalQuery = apollo.signal.query({
        query,
        variables: () => id() !== null ? ({ id: id() }) : null,
        injector
      });

      tick();
      expect(signalQuery.data()).toEqual({ book: { id: 1, name: 'Book 1' } });

      // Set variables to null - data resets, previousData preserves last value
      id.set(null);
      tick();

      expect(signalQuery.data()).toBeUndefined();
      expect(signalQuery.previousData()).toEqual({ book: { id: 1, name: 'Book 1' } });

      // Under `none` the result type guarantees data, so having nothing to execute has to reject.
      let rejection: Error | undefined;
      signalQuery.execute().catch((error: Error) => {
        rejection = error;
      });
      tick();

      expect(rejection?.name).toBe('AbortError');

      // `all` admits undefined data, so it resolves with none instead.
      const allQuery = apollo.signal.query({ query, errorPolicy: 'all', variables: () => null, injector });
      let allData: unknown = 'unset';
      void allQuery.execute().then(result => {
        allData = result.data;
      });
      tick();

      expect(allData).toBeUndefined();
    }));
  });

  describe('reactive options', () => {
    it('should carry a changed context on the next request without fetching for it', fakeAsync(() => {
      const query = gql`query GetBook($id: Int!) {
        book(id: $id) { id name }
      }`;

      mockLink.addMockedResponse({
        request: { query, variables: () => true },
        result: ({ id }) => ({ data: { book: { id, name: `Book ${id}` } } }),
        maxUsageCount: Number.POSITIVE_INFINITY
      });

      const requestedContexts: Array<unknown> = [];
      const request = mockLink.request.bind(mockLink);
      mockLink.request = operation => {
        requestedContexts.push(operation.getContext().tag);
        return request(operation);
      };

      const tag = signal('initial');

      const signalQuery = apollo.signal.query({
        query,
        variables: () => ({ id: 1 }),
        fetchPolicy: 'network-only',
        context: () => ({ tag: tag() }),
        injector
      });

      tick();
      expect(requestedContexts).toEqual(['initial']);

      tag.set('second');
      tick();

      // A context change is merged into the running query, which makes no request of its own.
      expect(requestedContexts).toEqual(['initial']);
      expect(signalQuery.loading()).toBe(false);

      void signalQuery.refetch();
      tick();

      expect(requestedContexts).toEqual(['initial', 'second']);
    }));

    it('should start and stop polling when pollInterval changes', fakeAsync(() => {
      const query: TypedDocumentNode<Value> = gql`query GetValue { value }`;

      mockLink.addMockedResponse({
        request: { query },
        result: { data: { value: 'expected' } },
        maxUsageCount: Number.POSITIVE_INFINITY
      });

      let requests = 0;
      const request = mockLink.request.bind(mockLink);
      mockLink.request = operation => {
        requests++;
        return request(operation);
      };

      const pollInterval = signal(0);

      const signalQuery = apollo.signal.query({ query, pollInterval, injector });

      tick();
      expect(requests).toBe(1);

      pollInterval.set(100);
      tick();
      expect(requests).toBe(1);

      tick(100);
      expect(requests).toBe(2);

      // Polling has to be cancelled, or `fakeAsync` fails the test on the timer left in the queue.
      pollInterval.set(0);
      tick();
      tick(200);

      expect(requests).toBe(2);
      expect(signalQuery.data()).toEqual({ value: 'expected' });
    }));

    it('should make one request with the new document when the query changes', fakeAsync(() => {
      interface Values {
        value?: string;
        other?: string;
      }

      const valueQuery: TypedDocumentNode<Values> = gql`query GetValue { value }`;
      const otherQuery: TypedDocumentNode<Values> = gql`query GetOther { other }`;

      mockLink.addMockedResponse({
        request: { query: valueQuery },
        result: { data: { value: 'expected' } },
        maxUsageCount: Number.POSITIVE_INFINITY
      });

      mockLink.addMockedResponse({
        request: { query: otherQuery },
        result: { data: { other: 'other' } },
        maxUsageCount: Number.POSITIVE_INFINITY
      });

      const operationNames: Array<string | undefined> = [];
      const request = mockLink.request.bind(mockLink);
      mockLink.request = operation => {
        operationNames.push(operation.operationName);
        return request(operation);
      };

      const other = signal(false);

      const signalQuery = apollo.signal.query({
        query: () => other() ? otherQuery : valueQuery,
        fetchPolicy: 'network-only',
        injector
      });

      tick();
      expect(operationNames).toEqual(['GetValue']);
      expect(signalQuery.data()).toEqual({ value: 'expected' });

      other.set(true);
      tick();

      expect(operationNames).toEqual(['GetValue', 'GetOther']);
      expect(signalQuery.data()).toEqual({ other: 'other' });
    }));

    it('should park and restart the query when fetchPolicy moves to and from standby', fakeAsync(() => {
      const query: TypedDocumentNode<Value> = gql`query GetValue { value }`;

      mockLink.addMockedResponse({
        request: { query },
        result: { data: { value: 'expected' } },
        maxUsageCount: Number.POSITIVE_INFINITY
      });

      let requests = 0;
      const request = mockLink.request.bind(mockLink);
      mockLink.request = operation => {
        requests++;
        return request(operation);
      };

      const fetchPolicy = signal<WatchQueryFetchPolicy>('network-only');

      const signalQuery = apollo.signal.query({ query, fetchPolicy, injector });

      tick();
      expect(requests).toBe(1);

      // `standby` is the one policy change Apollo parks the query for, rather than merging it.
      fetchPolicy.set('standby');
      tick();
      expect(requests).toBe(1);

      fetchPolicy.set('network-only');
      tick();

      expect(requests).toBe(2);
      expect(signalQuery.data()).toEqual({ value: 'expected' });
    }));

    it('should not request when variables change while the query is parked in standby', fakeAsync(() => {
      const query: TypedDocumentNode<Value, { id: string }> = gql`query GetValue($id: ID!) { value(id: $id) }`;

      for (const id of ['1', '2']) {
        mockLink.addMockedResponse({
          request: { query, variables: { id } },
          result: { data: { value: id } },
          maxUsageCount: Number.POSITIVE_INFINITY
        });
      }

      let requests = 0;
      const request = mockLink.request.bind(mockLink);
      mockLink.request = operation => {
        requests++;
        return request(operation);
      };

      const id = signal('1');
      const fetchPolicy = signal<WatchQueryFetchPolicy>('network-only');

      const signalQuery = apollo.signal.query({ query, variables: () => ({ id: id() }), fetchPolicy, injector });

      tick();
      expect(requests).toBe(1);

      fetchPolicy.set('standby');
      tick();
      expect(requests).toBe(1);

      // `setVariables` reobserves with `initialFetchPolicy`, which is never `standby`, so routing a parked
      // query through it would restart the query the caller parked.
      id.set('2');
      tick();
      expect(requests).toBe(1);

      fetchPolicy.set('network-only');
      tick();

      expect(requests).toBe(2);
      expect(signalQuery.data()).toEqual({ value: '2' });
    }));

    it('should not park the query forever when the caller fetchPolicy starts as standby', fakeAsync(() => {
      const query: TypedDocumentNode<Value, { id: string }> = gql`query GetValue($id: ID!) { value(id: $id) }`;

      for (const id of ['1', '2']) {
        mockLink.addMockedResponse({
          request: { query, variables: { id } },
          result: { data: { value: id } },
          maxUsageCount: Number.POSITIVE_INFINITY
        });
      }

      const id = signal('1');
      const fetchPolicy = signal<WatchQueryFetchPolicy>('standby');

      const signalQuery = apollo.signal.query({ query, variables: () => ({ id: id() }), fetchPolicy, injector });

      tick();
      expect(signalQuery.data()).toBeUndefined();

      fetchPolicy.set('network-only');
      tick();
      expect(signalQuery.data()).toEqual({ value: '1' });

      // Apollo refuses to store `standby` as the initial policy, so a later variables change, which reobserves
      // with that policy, still reaches the network.
      id.set('2');
      tick();

      expect(signalQuery.data()).toEqual({ value: '2' });
    }));

    it('should still re-execute for a document changed before a refetch', fakeAsync(() => {
      interface Values { value?: string; other?: string }
      const valueQuery: TypedDocumentNode<Values, { id: string }> = gql`query GetValue($id: ID!) { value(id: $id) }`;
      const otherQuery: TypedDocumentNode<Values, { id: string }> = gql`query GetOther($id: ID!) { other(id: $id) }`;

      for (const document of [valueQuery, otherQuery]) {
        mockLink.addMockedResponse({
          request: { query: document, variables: () => true },
          result: { data: { value: 'v', other: 'o' } },
          maxUsageCount: Number.POSITIVE_INFINITY
        });
      }

      const operationNames: Array<string | undefined> = [];
      const request = mockLink.request.bind(mockLink);
      mockLink.request = operation => {
        operationNames.push(operation.operationName);
        return request(operation);
      };

      const other = signal(false);
      const signalQuery = apollo.signal.query({
        query: () => other() ? otherQuery : valueQuery,
        variables: () => ({ id: '1' }),
        injector
      });

      tick();

      // The document change is still pending when the refetch records what Apollo was handed, so the record
      // must keep the old document or the effect would think the new one had already been applied.
      other.set(true);
      void signalQuery.refetch({ id: '2' });
      tick();

      expect(operationNames).toEqual(['GetValue', 'GetValue', 'GetOther']);
    }));

    it('should keep a changed fetchPolicy on the next variables change', fakeAsync(() => {
      const query: TypedDocumentNode<Value, { id: string }> = gql`query GetValue($id: ID!) { value(id: $id) }`;

      for (const id of ['1', '2']) {
        mockLink.addMockedResponse({
          request: { query, variables: { id } },
          result: { data: { value: id } },
          maxUsageCount: Number.POSITIVE_INFINITY
        });
      }

      let requests = 0;
      const request = mockLink.request.bind(mockLink);
      mockLink.request = operation => {
        requests++;
        return request(operation);
      };

      const id = signal('1');
      const fetchPolicy = signal<WatchQueryFetchPolicy>('cache-first');

      const signalQuery = apollo.signal.query({ query, variables: () => ({ id: id() }), fetchPolicy, injector });

      tick();
      id.set('2');
      tick();
      id.set('1');
      tick();
      expect(requests).toBe(2);

      fetchPolicy.set('network-only');
      tick();
      expect(requests).toBe(2);

      // `setVariables` would reobserve with `initialFetchPolicy`, which is still `cache-first`, and serve this
      // from the cache.
      id.set('2');
      tick();

      expect(requests).toBe(3);
      expect(signalQuery.data()).toEqual({ value: '2' });
    }));

    it('should re-read a reactive option after a lazy query is executed', fakeAsync(() => {
      const query: TypedDocumentNode<Value> = gql`query GetValue { value }`;

      mockLink.addMockedResponse({
        request: { query },
        result: { data: { value: 'expected' } },
        maxUsageCount: Number.POSITIVE_INFINITY
      });

      const requestedContexts: Array<unknown> = [];
      const request = mockLink.request.bind(mockLink);
      mockLink.request = operation => {
        requestedContexts.push(operation.getContext().tag);
        return request(operation);
      };

      const tag = signal('initial');

      const lazyQuery = apollo.signal.query({ query, context: () => ({ tag: tag() }), injector, lazy: true });

      tick();

      expect(lazyQuery.active()).toBe(false);
      expect(mockLink.operation).toBeUndefined();

      void lazyQuery.execute();
      tick();

      expect(lazyQuery.active()).toBe(true);
      expect(lazyQuery.data()).toEqual({ value: 'expected' });
      expect(requestedContexts).toEqual(['initial']);

      tag.set('second');
      tick();

      expect(requestedContexts).toEqual(['initial']);

      void lazyQuery.refetch();
      tick();

      expect(requestedContexts).toEqual(['initial', 'second']);
    }));
  });

  describe('single request per execution', () => {
    // Deduplication hides a duplicate request rather than preventing it, so it has to be off for the count to mean anything.
    const withoutDeduplication = (): { apollo: Apollo; injector: Injector; link: MockLink; requests: Array<OperationVariables> } => {
      const requests: Array<OperationVariables> = [];
      const link = new MockLink([], { defaultOptions: { delay: 0 } });
      const counting = new ApolloLink((operation, forward) => {
        requests.push(operation.variables);
        return forward(operation);
      });

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [provideApollo(withApolloOptions(() => ({
          cache: new InMemoryCache(),
          link: ApolloLink.from([counting, link]),
          queryDeduplication: false
        })))]
      });

      return { apollo: TestBed.inject(Apollo), injector: TestBed.inject(Injector), link, requests };
    };

    it('should make one request on first execution', fakeAsync(() => {
      const query: TypedDocumentNode<Value> = gql`query GetValue { value }`;
      const scoped = withoutDeduplication();

      scoped.link.addMockedResponse({
        request: { query },
        result: { data: { value: 'expected' } },
        maxUsageCount: Number.POSITIVE_INFINITY
      });

      const signalQuery = scoped.apollo.signal.query({ query, injector: scoped.injector });

      tick();

      expect(signalQuery.data()).toEqual({ value: 'expected' });
      expect(scoped.requests).toHaveLength(1);
    }));

    it('should make one request when a lazy query is executed', async () => {
      const query: TypedDocumentNode<Value> = gql`query GetValue { value }`;
      const scoped = withoutDeduplication();

      scoped.link.addMockedResponse({
        request: { query },
        result: { data: { value: 'expected' } },
        maxUsageCount: Number.POSITIVE_INFINITY
      });

      const lazyQuery = scoped.apollo.signal.query({ query, lazy: true, injector: scoped.injector });

      const result = await lazyQuery.execute();

      expect(result.data).toEqual({ value: 'expected' });
      expect(lazyQuery.data()).toEqual({ value: 'expected' });
      expect(scoped.requests).toHaveLength(1);
    });

    it('should make one request when refetch is given variables', fakeAsync(() => {
      const query: TypedDocumentNode<Value, { id: string }> = gql`query GetValue($id: ID!) { value(id: $id) }`;
      const scoped = withoutDeduplication();

      scoped.link.addMockedResponse({
        request: { query, variables: () => true },
        result: ({ id }) => ({ data: { value: `value-${id}` } }),
        maxUsageCount: Number.POSITIVE_INFINITY,
        delay: 10
      });

      const signalQuery = scoped.apollo.signal.query({
        query,
        variables: () => ({ id: '1' }),
        notifyOnNetworkStatusChange: true,
        injector: scoped.injector
      });

      tick(10);

      void signalQuery.refetch({ id: '2' });
      tick(0);

      expect(signalQuery.networkStatus()).toBe(NetworkStatus.refetch);

      tick(10);

      expect(scoped.requests).toEqual([{ id: '1' }, { id: '2' }]);
      expect(signalQuery.data()).toEqual({ value: 'value-2' });
    }));

    it('should make one request when refetch supersedes a variables change still in flight', fakeAsync(() => {
      const query: TypedDocumentNode<Value, { id: string }> = gql`query GetValue($id: ID!) { value(id: $id) }`;
      const scoped = withoutDeduplication();

      scoped.link.addMockedResponse({
        request: { query, variables: () => true },
        result: ({ id }) => ({ data: { value: `value-${id}` } }),
        maxUsageCount: Number.POSITIVE_INFINITY,
        delay: 20
      });

      const id = signal('1');
      const signalQuery = scoped.apollo.signal.query({ query, variables: () => ({ id: id() }), injector: scoped.injector });

      tick(20);

      // The effect's reobserve is still in flight when the refetch supersedes it.
      id.set('2');
      tick(0);
      void signalQuery.refetch({ id: '3' });
      tick(20);

      expect(scoped.requests).toEqual([{ id: '1' }, { id: '2' }, { id: '3' }]);
      expect(signalQuery.variables()).toEqual({ id: '3' });
      expect(signalQuery.data()).toEqual({ value: 'value-3' });
    }));

    // A nextFetchPolicy callback exposes the initial policy retained when the query leaves standby.
    it('should keep the caller fetchPolicy as the initial policy across the standby creation', fakeAsync(() => {
      const query: TypedDocumentNode<Value, { id: string }> = gql`query GetValue($id: ID!) { value(id: $id) }`;
      const scoped = withoutDeduplication();

      scoped.link.addMockedResponse({
        request: { query, variables: () => true },
        result: ({ id }) => ({ data: { value: `value-${id}` } }),
        maxUsageCount: Number.POSITIVE_INFINITY
      });

      const initialFetchPolicies: Array<WatchQueryFetchPolicy | undefined> = [];
      const id = signal('1');

      const signalQuery = scoped.apollo.signal.query({
        query,
        variables: () => ({ id: id() }),
        fetchPolicy: 'network-only',
        nextFetchPolicy: (currentFetchPolicy, { initialFetchPolicy }) => {
          initialFetchPolicies.push(initialFetchPolicy);
          return currentFetchPolicy;
        },
        injector: scoped.injector
      });

      tick();
      id.set('2');
      tick();

      expect(initialFetchPolicies.length).toBeGreaterThan(0);
      expect(initialFetchPolicies.every(policy => policy === 'network-only')).toBe(true);
      expect(scoped.requests).toEqual([{ id: '1' }, { id: '2' }]);
      expect(signalQuery.data()).toEqual({ value: 'value-2' });
    }));

    // Forcing the policy is confined to the execution that leaves `standby`. A re-execution of a live query passes
    // no policy of its own, so the observable keeps what `nextFetchPolicy` left behind (`network-only` here, hence
    // the second request) rather than reverting to the initial `cache-first`, which the cache would have answered.
    it('should not revert to the initial fetchPolicy when a live query is re-executed', fakeAsync(() => {
      const query: TypedDocumentNode<Value> = gql`query GetValue { value }`;
      const scoped = withoutDeduplication();

      scoped.link.addMockedResponse({
        request: { query },
        result: { data: { value: 'expected' } },
        maxUsageCount: Number.POSITIVE_INFINITY
      });

      const signalQuery = scoped.apollo.signal.query({
        query,
        nextFetchPolicy: 'network-only',
        injector: scoped.injector
      });

      tick();
      void signalQuery.execute();
      tick();

      expect(scoped.requests).toHaveLength(2);
      expect(signalQuery.data()).toEqual({ value: 'expected' });
    }));
  });

  describe('initial loading state', () => {
    const query: TypedDocumentNode<Value> = gql`query { value }`;
    it('should not report loading for a lazy query', fakeAsync(() => {
      const signalQuery = apollo.signal.query({ query, lazy: true, injector });

      expect(signalQuery.loading()).toBe(false);
      expect(signalQuery.networkStatus()).toBe(NetworkStatus.ready);

      tick(0);

      expect(signalQuery.loading()).toBe(false);
    }));

    it('should not report loading for a standby query', fakeAsync(() => {
      const signalQuery = apollo.signal.query({ query, fetchPolicy: 'standby', injector });

      expect(signalQuery.loading()).toBe(false);
      expect(signalQuery.networkStatus()).toBe(NetworkStatus.ready);

      tick(0);

      expect(signalQuery.loading()).toBe(false);
      expect(signalQuery.active()).toBe(true);
    }));
  });

  describe('termination', () => {
    const query: TypedDocumentNode<Value> = gql`query { value }`;

    it('should clear the loading state when terminated before the first effect', fakeAsync(() => {
      mockLink.addMockedResponse({ request: { query }, result: { data: { value: 'expected' } }, delay: 10 });

      const signalQuery = apollo.signal.query({ query, injector });

      signalQuery.terminate();
      tick(50);

      expect(signalQuery.loading()).toBe(false);
      expect(signalQuery.networkStatus()).toBe(NetworkStatus.ready);
      expect(signalQuery.active()).toBe(false);
    }));

    it('should clear a loading state that was already read', fakeAsync(() => {
      const signalQuery = apollo.signal.query({ query, injector });

      expect(signalQuery.loading()).toBe(true);

      signalQuery.terminate();
      tick();

      expect(signalQuery.loading()).toBe(false);
      expect(signalQuery.active()).toBe(false);
    }));

    it('should clear the loading state when variables turn null in the same tick', fakeAsync(() => {
      const request = vi.spyOn(mockLink, 'request');
      const id = signal<string | null>('1');

      const signalQuery = apollo.signal.query({
        query,
        variables: () => id() === null ? null : { id: id() },
        injector
      });

      expect(signalQuery.loading()).toBe(true);
      id.set(null);
      tick();

      expect(signalQuery.loading()).toBe(false);
      expect(signalQuery.networkStatus()).toBe(NetworkStatus.ready);
      expect(signalQuery.enabled()).toBe(true);
      expect(signalQuery.active()).toBe(false);
      expect(request).not.toHaveBeenCalled();

      mockLink.addMockedResponse({ request: { query, variables: { id: '2' } }, result: { data: { value: 'resumed' } } });
      id.set('2');
      tick();

      expect(signalQuery.data()).toEqual({ value: 'resumed' });
      expect(request).toHaveBeenCalledOnce();
    }));

    it('should keep the same result and previous data when terminated repeatedly', fakeAsync(() => {
      mockLink.addMockedResponse({ request: { query }, result: { data: { value: 'expected' } }, delay: 10 });

      const signalQuery = apollo.signal.query({ query, injector });

      tick(10);

      signalQuery.terminate();
      const cleared = signalQuery.result();

      signalQuery.terminate();
      signalQuery.terminate();

      expect(signalQuery.result()).toBe(cleared);
      expect(signalQuery.previousData()).toEqual({ value: 'expected' });
    }));
  });

  describe('in-flight visibility on a variables change', () => {
    const keyed: TypedDocumentNode<Value, { id: string }> = gql`query Q($id: ID!) { value(id: $id) }`;

    for (const notifyOnNetworkStatusChange of [true, false]) {
      it(`should refresh loading from the current result when notifications are suppressed (notifyOnNetworkStatusChange: ${notifyOnNetworkStatusChange})`, fakeAsync(() => {
        mockLink.addMockedResponse({ request: { query: keyed, variables: { id: '1' } }, result: { data: { value: 'one' } }, delay: 5 });
        mockLink.addMockedResponse({ request: { query: keyed, variables: { id: '2' } }, result: { data: { value: 'two' } }, delay: 5 });

        const id = signal('1');
        const watchQuery = vi.spyOn(apollo, 'watchQuery');
        const signalQuery = apollo.signal.query({ query: keyed, variables: () => ({ id: id() }), notifyOnNetworkStatusChange, injector });

        tick(10);

        expect(signalQuery.data()).toEqual({ value: 'one' });

        const emitted = vi.fn();
        const subscription = watchQuery.mock.results[0].value.subscribe(emitted);
        emitted.mockClear();

        id.set('2');
        tick(0);

        if (notifyOnNetworkStatusChange) expect(emitted).toHaveBeenCalled();
        else expect(emitted).not.toHaveBeenCalled();

        expect(signalQuery.loading()).toBe(true);
        expect(signalQuery.networkStatus()).toBe(NetworkStatus.setVariables);
        expect(signalQuery.data()).toBeUndefined();
        expect(signalQuery.previousData()).toEqual({ value: 'one' });

        tick(10);

        expect(signalQuery.data()).toEqual({ value: 'two' });
        expect(signalQuery.loading()).toBe(false);

        subscription.unsubscribe();
        signalQuery.terminate();
      }));
    }
  });

  describe('required inputs', () => {
    const keyed: TypedDocumentNode<Value, { id: string }> = gql`query Q($id: ID!) { value(id: $id) }`;

    @Component({ template: '', standalone: true })
    class Host {
      public readonly id = input.required<string>();
      public readonly query = inject(Apollo).signal.query({ query: keyed, variables: () => ({ id: this.id() }) });
    }

    it('should not read variables before the component receives its inputs', () => {
      const fixture = TestBed.createComponent(Host);

      fixture.componentRef.setInput('id', '1');

      expect(fixture.componentInstance.query.variables()).toEqual({ id: '1' });
    });

    it('should destroy cleanly when the inputs were never set', () => {
      const fixture = TestBed.createComponent(Host);

      expect(() => fixture.destroy()).not.toThrow();
    });
  });

  it('should resolve a standby execution without data', async () => {
    const query: TypedDocumentNode<Value> = gql`query { value }`;
    const signalQuery = apollo.signal.query({ query, injector, lazy: true, fetchPolicy: 'standby' });

    expect((await signalQuery.execute()).data).toBeUndefined();
  });
});
