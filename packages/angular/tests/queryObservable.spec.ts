import { fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { Apollo, QueryObservable, QueryResult } from '@apollo-orbit/angular';
import { gql, NetworkStatus, ObservableQuery, OperationVariables, TypedDocumentNode, WatchQueryFetchPolicy } from '@apollo/client';
import { MockLink } from '@apollo/client/testing';
import { GraphQLError } from 'graphql';
import { provideApolloMock } from './helpers';

const allFetchPolicies: Array<WatchQueryFetchPolicy> = ['cache-first', 'cache-only', 'network-only', 'no-cache', 'standby'];

describe('QueryObservable', () => {
  let apollo: Apollo;
  let mockLink: MockLink;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideApolloMock()]
    });

    apollo = TestBed.inject(Apollo);
    mockLink = TestBed.inject(MockLink);
  });

  it.each(['none', 'all', 'ignore'] as const)('settles an aborted operation using its original errorPolicy %s', async errorPolicy => {
    const query = gql`query { value }`;
    mockLink.addMockedResponse({ request: { query }, result: { data: { value: 'late' } }, delay: 100 });
    const watch = apollo.watchQuery({ query, errorPolicy });
    const pending = watch.reobserve();
    watch.applyOptions({ errorPolicy: errorPolicy === 'none' ? 'ignore' : 'none' });
    watch.stop();

    if (errorPolicy === 'none') {
      await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    } else if (errorPolicy === 'all') {
      await expect(pending).resolves.toMatchObject({ data: undefined, error: { name: 'AbortError' } });
    } else {
      await expect(pending).resolves.toEqual({ data: undefined });
    }
  });

  for (const fetchPolicy of allFetchPolicies.filter(policy => !['cache-only', 'standby'].includes(policy))) {
    it(`should emit loading subscription: (notifyOnNetworkStatusChange: true (default), fetchPolicy: ${fetchPolicy})`, fakeAsync(() => {
      const mockFn = vi.fn();
      const query: TypedDocumentNode<{ value: string }> = gql`query { value }`;
      mockLink.addMockedResponse({
        request: { query },
        result: { data: { value: 'expected' } },
        delay: 10
      });

      apollo.watchQuery({ query, fetchPolicy }).subscribe(result => {
        mockFn(result);
      });

      tick(10);

      expect(mockFn.mock.calls).toMatchObject([
        [{
          data: undefined,
          loading: true,
          networkStatus: 1,
          previousData: undefined
        }],
        [{
          data: { value: 'expected' },
          loading: false,
          networkStatus: 7
        }]
      ]);
    }));
  }

  for (const fetchPolicy of allFetchPolicies.filter(policy => !['cache-only', 'standby'].includes(policy))) {
    it(`should not emit loading (notifyOnNetworkStatusChange: false, fetchPolicy: ${fetchPolicy})`, fakeAsync(() => {
      const mockFn = vi.fn();
      const query: TypedDocumentNode<{ value: string }> = gql`query { value }`;
      mockLink.addMockedResponse({
        request: { query },
        result: { data: { value: 'expected' } },
        delay: 10
      });

      apollo.watchQuery({ query, fetchPolicy, notifyOnNetworkStatusChange: false }).subscribe(result => {
        mockFn(result);
      });

      tick(10);

      expect(mockFn.mock.calls).toMatchObject([
        [{
          data: { value: 'expected' },
          networkStatus: 7
        }]
      ]);
    }));
  }

  it('should emit current result on subscription', waitForAsync(() => {
    const query: TypedDocumentNode<{ value: string }> = gql`query { value }`;

    apollo.cache.writeQuery({ query, data: { value: 'expected' } });

    apollo.watchQuery({ query }).subscribe(
      result => {
        if (result.loading) {
          expect(result.data?.value).toEqual('expected');
        } else {
          expect(result.data?.value).toEqual('expected');
        }
      }
    );
  }));

  it('should emit initial cached result (notifyOnNetworkStatusChange: false)', fakeAsync(() => {
    const mockFn = vi.fn();
    const query: TypedDocumentNode<{ value: string }> = gql`query { value }`;

    apollo.cache.writeQuery({ query, data: { value: 'expected' } });

    apollo.watchQuery({ query, fetchPolicy: 'cache-first', notifyOnNetworkStatusChange: false }).subscribe(result => {
      mockFn(result);
    });

    tick(10);

    expect(mockFn.mock.calls).toMatchObject([
      [{
        data: { value: 'expected' },
        networkStatus: 7
      }]
    ]);
  }));

  it('should emit on cache update', fakeAsync(() => {
    const mockFn = vi.fn();

    const query: TypedDocumentNode<{ value: string }> = gql`query { value }`;
    mockLink.addMockedResponse({
      request: { query },
      result: { data: { value: 'expected 1' } }
    });

    apollo.watchQuery({ query }).subscribe(
      result => {
        if (!result.loading) {
          mockFn(result.data?.value);
        }
      }
    );
    tick(20);
    apollo.cache.modify({ fields: { value: () => 'expected 2' } });
    tick();
    expect(mockFn.mock.calls).toEqual([['expected 1'], ['expected 2']]);
  }));

  it('should emit on refetch', fakeAsync(() => {
    const mockFn = vi.fn();

    const query: TypedDocumentNode<{ value: string }> = gql`query { value }`;
    mockLink.addMockedResponse({ request: { query }, result: { data: { value: 'expected 1' } } });
    mockLink.addMockedResponse({ request: { query }, result: { data: { value: 'expected 2' } } });

    const query$ = apollo.watchQuery({ query });

    query$.subscribe(
      result => {
        if (!result.loading) {
          mockFn(result.data?.value);

          if (mockFn.mock.calls.length === 2) {
            expect(mockFn.mock.calls).toEqual([['expected 1'], ['expected 2']]);
          }
        }
      }
    );
    tick();
    query$.refetch();
    tick();
  }));

  it('should not emit after unsubscribe', fakeAsync(() => {
    const mockFn = vi.fn();

    const query: TypedDocumentNode<{ value: string }> = gql`query { value }`;
    mockLink.addMockedResponse({ request: { query }, result: { data: { value: 'expected 1' } } });
    mockLink.addMockedResponse({ request: { query }, result: { data: { value: 'expected 2' } } });

    const query$ = apollo.watchQuery({ query });

    const subscription = query$.subscribe(
      result => {
        if (!result.loading) {
          mockFn(result.data?.value);
        }
      }
    );

    tick();
    subscription.unsubscribe();
    query$.refetch();
    tick();
    expect(mockFn.mock.calls.length).toEqual(1);
  }));

  it('should recover resubscribe on error', fakeAsync(() => {
    const query: TypedDocumentNode<{ value: string }> = gql`query { value }`;

    mockLink.addMockedResponse({
      request: { query },
      result: { data: { value: 'expected 1' } }
    });

    mockLink.addMockedResponse({
      request: { query },
      result: { data: { value: 'expected 2' } },
      delay: 10
    });

    const queryObservable = apollo.watchQuery({ query, notifyOnNetworkStatusChange: true });

    const mockFn = vi.fn();
    const subscription = queryObservable.subscribe(result => {
      mockFn(result);
    });

    tick();

    queryObservable.refetch();
    tick();
    tick(10);

    subscription.unsubscribe();

    expect(mockFn.mock.calls).toMatchObject([
      [{
        loading: true,
        networkStatus: NetworkStatus.loading,
        data: undefined,
        previousData: undefined
      }],
      [{
        loading: false,
        networkStatus: NetworkStatus.ready,
        data: { value: 'expected 1' },
        previousData: undefined
      }],
      [{
        loading: true,
        networkStatus: NetworkStatus.refetch,
        data: { value: 'expected 1' },
        previousData: { value: 'expected 1' }
      }],
      [{
        loading: false,
        networkStatus: NetworkStatus.ready,
        data: { value: 'expected 2' },
        previousData: { value: 'expected 1' }
      }]
    ]);

    mockFn.mockClear();
    queryObservable.subscribe(result => {
      mockFn(result);
    });
    tick();

    mockLink.addMockedResponse({
      request: { query },
      result: { errors: [new GraphQLError('Invalid query')] }
    });
    queryObservable.refetch();
    tick();

    mockLink.addMockedResponse({
      request: { query },
      result: { data: { value: 'expected 3' } }
    });
    queryObservable.refetch();
    tick();

    expect(mockFn.mock.calls).toMatchObject([
      [{ data: { value: 'expected 2' }, loading: false, networkStatus: 7, previousData: undefined }],
      [{ data: { value: 'expected 2' }, loading: true, networkStatus: 4, previousData: { value: 'expected 2' } }],
      [{ data: { value: 'expected 2' }, loading: false, networkStatus: 8, error: { errors: [{ message: 'Invalid query' }] }, previousData: { value: 'expected 2' } }],
      [{ data: { value: 'expected 2' }, loading: true, networkStatus: 4, previousData: { value: 'expected 2' } }],
      [{ data: { value: 'expected 3' }, loading: false, networkStatus: 7, previousData: { value: 'expected 2' } }]
    ]);
  }));

  it('should handle complete callback when query is stopped', fakeAsync(() => {
    const query = gql`query { value }`;
    const completeFn = vi.fn();

    mockLink.addMockedResponse({
      request: { query },
      result: { data: { value: 'test' } }
    });

    const queryObservable = apollo.watchQuery({ query });

    queryObservable.subscribe({
      next: () => { },
      complete: completeFn
    });

    tick();

    queryObservable.stop();

    tick();
    expect(completeFn).toHaveBeenCalled();
  }));

  it('should propagate method calls to underlying ObservableQuery', fakeAsync(() => {
    const query = gql`query TestQuery { value }`;

    // Create a mock ObservableQuery
    const mockObservableQuery = {
      query,
      variables: {},
      options: { query },
      queryName: 'TestQuery',
      getCurrentResult: vi.fn().mockReturnValue({ data: { value: 'test' }, loading: false }),
      refetch: vi.fn().mockResolvedValue({}),
      fetchMore: vi.fn().mockResolvedValue({}),
      subscribeToMore: vi.fn().mockReturnValue(() => { }),
      updateQuery: vi.fn(),
      setVariables: vi.fn().mockResolvedValue({}),
      startPolling: vi.fn(),
      stopPolling: vi.fn(),
      reobserve: vi.fn().mockResolvedValue({}),
      hasObservers: vi.fn().mockReturnValue(false),
      subscribe: vi.fn().mockReturnValue({ unsubscribe: vi.fn() }),
      stop: vi.fn()
    };

    // Create QueryObservable with the mock
    const queryObservable = new QueryObservable(mockObservableQuery as unknown as ObservableQuery<any, OperationVariables>);

    // Test getter properties
    expect(queryObservable.query).toBe(query);
    expect(queryObservable.variables).toBeDefined();
    expect(queryObservable.options).toBeDefined();
    expect(queryObservable.queryName).toBe('TestQuery');

    // Test method delegation
    queryObservable.getCurrentResult();
    expect(mockObservableQuery.getCurrentResult).toHaveBeenCalled();

    queryObservable.refetch();
    expect(mockObservableQuery.refetch).toHaveBeenCalled();

    queryObservable.fetchMore({ variables: {} });
    expect(mockObservableQuery.fetchMore).toHaveBeenCalledWith({ variables: {} });

    const subscription = gql`subscription { valueChanged }`;
    queryObservable.subscribeToMore({
      subscription,
      updateQuery: prev => prev
    });
    expect(mockObservableQuery.subscribeToMore).toHaveBeenCalledWith({
      document: subscription,
      updateQuery: expect.any(Function)
    });

    queryObservable.updateQuery(() => ({ value: 'updated' }));
    expect(mockObservableQuery.updateQuery).toHaveBeenCalled();

    queryObservable.setVariables({});
    expect(mockObservableQuery.setVariables).toHaveBeenCalled();

    queryObservable.startPolling(1000);
    expect(mockObservableQuery.startPolling).toHaveBeenCalledWith(1000);

    queryObservable.stopPolling();
    expect(mockObservableQuery.stopPolling).toHaveBeenCalled();

    queryObservable.reobserve();
    expect(mockObservableQuery.reobserve).toHaveBeenCalled();

    queryObservable.hasObservers();
    expect(mockObservableQuery.hasObservers).toHaveBeenCalled();

    queryObservable.stop();
    expect(mockObservableQuery.stop).toHaveBeenCalled();
  }));

  describe('errorPolicy', () => {
    describe('errorPolicy: all', () => {
      it('should emit graphql errors and not throw on reobserve (errorPolicy: all)', waitForAsync(async () => {
        const errorFn = vi.fn();
        const query: TypedDocumentNode<{ value: string }> = gql`query { value }`;
        mockLink.addMockedResponse({ request: { query }, result: { errors: [new GraphQLError('Invalid query')] } });

        const queryObservable = apollo.watchQuery({ query, errorPolicy: 'all' });

        queryObservable.subscribe(
          result => {
            if (!result.loading) {
              expect(result.error?.message).toEqual('Invalid query');
            }
          }
        );

        try {
          const result = await queryObservable.reobserve();
          expect(result.error?.message).toEqual('Invalid query');
        } catch (error) {
          errorFn(error);
        }

        expect(errorFn).not.toHaveBeenCalled();
      }));

      it('should emit network error (errorPolicy: all)', waitForAsync(() => {
        const query: TypedDocumentNode<{ value: string }> = gql`query { value }`;
        mockLink.addMockedResponse({ request: { query }, error: new Error('An unexpected error has occurred') });

        apollo.watchQuery({ query, errorPolicy: 'all' }).subscribe(result => {
          if (!result.loading) {
            expect(result.error?.message).toEqual('An unexpected error has occurred');
          }
        });
      }));

      it('should emit error with data (errorPolicy: all)', fakeAsync(() => {
        const mockFn = vi.fn();

        const query: TypedDocumentNode<{ value: string }> = gql`query { value value2 }`;
        mockLink.addMockedResponse({ request: { query }, result: { data: { value: 'expected 1' } } });
        mockLink.addMockedResponse({ request: { query }, result: { data: { value: 'expected 1' }, errors: [new GraphQLError('Invalid query')] } });

        const query$ = apollo.watchQuery({ query, errorPolicy: 'all' });

        query$.subscribe(
          result => {
            if (!result.loading) {
              const { data, error } = result;
              mockFn({ value: data?.value, error: error?.message });
            }
          }
        );

        tick();

        query$.refetch();

        tick();

        expect(mockFn.mock.calls).toEqual([
          [{ value: 'expected 1', error: undefined }],
          [{ value: 'expected 1', error: 'Invalid query' }]
        ]);
      }));
    });

    describe('errorPolicy: none', () => {
      it('should emit graphql errors, ignore data and throw on reobserve (errorPolicy: none)', waitForAsync(async () => {
        const errorFn = vi.fn();
        const query: TypedDocumentNode<{ value: string }> = gql`query { value }`;
        mockLink.addMockedResponse({
          request: { query },
          result: { data: { value: 'expected' }, errors: [new GraphQLError('Invalid query')] }
        });

        const queryObservable = apollo.watchQuery({ query, errorPolicy: 'none' });

        queryObservable.subscribe(result => {
          if (!result.loading) {
            expect(result.error).toBeDefined();
            expect(result.data).toBeUndefined();
          }
        });

        try {
          await queryObservable.reobserve();
        } catch (error) {
          errorFn(error);
        }

        expect(errorFn).toHaveBeenCalledWith(expect.objectContaining({ message: 'Invalid query' }));
      }));
    });

    describe('errorPolicy: ignore', () => {
      it('should not emit graphql errors (errorPolicy: ignore)', waitForAsync(() => {
        const query: TypedDocumentNode<{ value: string }> = gql`query { value }`;
        mockLink.addMockedResponse({ request: { query }, result: { errors: [new GraphQLError('Invalid query')] } });

        apollo.watchQuery({ query, errorPolicy: 'ignore' }).subscribe(
          result => {
            if (!result.loading) {
              expect(result.error).toBeUndefined();
            }
          });
      }));

      it('should not emit network errors (errorPolicy: ignore)', waitForAsync(() => {
        const query: TypedDocumentNode<{ value: string }> = gql`query { value }`;
        mockLink.addMockedResponse({
          request: { query },
          error: new Error('An unexpected error has occurred')
        });

        apollo.watchQuery({ query, errorPolicy: 'ignore' }).subscribe(result => {
          expect(result.error).toBeUndefined();
        });
      }));
    });
  });

  it('should keep previous data independent for simultaneous subscribers', fakeAsync(() => {
    const document: TypedDocumentNode<{ value: string }> = gql`query { value }`;
    mockLink.addMockedResponse({ request: { query: document }, result: { data: { value: 'one' } } });
    mockLink.addMockedResponse({ request: { query: document }, result: { data: { value: 'two' } } });

    const watch = apollo.watchQuery({ query: document });
    const first: Array<QueryResult<{ value: string }>> = [];
    const second: typeof first = [];

    watch.subscribe(value => first.push(value));
    watch.subscribe(value => second.push(value));

    tick();
    void watch.refetch();
    tick();

    expect(first).toEqual(second);
    expect(first.at(-1)?.previousData).toEqual({ value: 'one' });

    watch.stop();
  }));

  it('should resolve setVariables without data when nothing observes the query', async () => {
    const keyed: TypedDocumentNode<{ value: string }, { id: string }> = gql`query ($id: ID!) { value(id: $id) }`;
    const watch = apollo.watchQuery({ query: keyed, variables: { id: '1' } });

    expect((await watch.setVariables({ id: '2' })).data).toBeUndefined();

    watch.stop();
  });
});
