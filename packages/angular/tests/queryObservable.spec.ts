import { fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { Apollo } from '@apollo-orbit/angular';
import { gql, NetworkStatus, WatchQueryFetchPolicy } from '@apollo/client';
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

  it('should emit current result on subscription', waitForAsync(() => {
    const query = gql`query { value }`;

    apollo.cache.writeQuery({ query, data: { value: 'expected' } });

    apollo.watchQuery<{ value: string }>({ query }).subscribe(
      result => {
        if (result.loading) {
          expect(result.data?.value).toEqual('expected');
        } else {
          expect(result.data?.value).toEqual('expected');
        }
      }
    );
  }));

  for (const fetchPolicy of allFetchPolicies.filter(policy => !['cache-only', 'standby'].includes(policy))) {
    it(`should emit loading subscription: (notifyOnLoading: true (default), fetchPolicy: ${fetchPolicy})`, fakeAsync(() => {
      const mockFn = jest.fn();
      const query = gql`query { value }`;
      mockLink.addMockedResponse({
        request: { query },
        result: { data: { value: 'expected' } },
        delay: 10
      });

      apollo.watchQuery<{ value: string }>({ query, fetchPolicy }).subscribe(result => {
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
    it(`should not emit loading (notifyOnLoading: false, fetchPolicy: ${fetchPolicy})`, fakeAsync(() => {
      const mockFn = jest.fn();
      const query = gql`query { value }`;
      mockLink.addMockedResponse({
        request: { query },
        result: { data: { value: 'expected' } },
        delay: 10
      });

      apollo.watchQuery<{ value: string }>({ query, fetchPolicy, notifyOnLoading: false, notifyOnNetworkStatusChange: true }).subscribe(result => {
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

  it('should emit initial cached result (notifyLoading: false)', fakeAsync(() => {
    const mockFn = jest.fn();
    const query = gql`query { value }`;

    apollo.cache.writeQuery({ query, data: { value: 'expected' } });

    apollo.watchQuery<{ value: string }>({ query, fetchPolicy: 'cache-first', notifyOnLoading: false, notifyOnNetworkStatusChange: true }).subscribe(result => {
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
    const mockFn = jest.fn();

    const query = gql`query { value }`;
    mockLink.addMockedResponse({
      request: { query },
      result: { data: { value: 'expected 1' } }
    });

    apollo.watchQuery<{ value: string }>({ query }).subscribe(
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
    const mockFn = jest.fn();

    const query = gql`query { value }`;
    mockLink.addMockedResponse({ request: { query }, result: { data: { value: 'expected 1' } } });
    mockLink.addMockedResponse({ request: { query }, result: { data: { value: 'expected 2' } } });

    const query$ = apollo.watchQuery<{ value: string }>({ query });

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
    const mockFn = jest.fn();

    const query = gql`query { value }`;
    mockLink.addMockedResponse({ request: { query }, result: { data: { value: 'expected 1' } } });
    mockLink.addMockedResponse({ request: { query }, result: { data: { value: 'expected 2' } } });

    const query$ = apollo.watchQuery<{ value: string }>({ query });

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
    const query = gql`query { value }`;

    mockLink.addMockedResponse({
      request: { query },
      result: { data: { value: 'expected 1' } }
    });

    mockLink.addMockedResponse({
      request: { query },
      result: { data: { value: 'expected 2' } },
      delay: 10
    });

    const queryObservable = apollo.watchQuery<{ value: string }>({ query, notifyOnNetworkStatusChange: true });

    const mockFn = jest.fn();
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
      [{ data: { value: 'expected 2' }, loading: false, networkStatus: 7, previousData: { value: 'expected 2' } }],
      [{ data: { value: 'expected 2' }, loading: true, networkStatus: 4, previousData: { value: 'expected 2' } }],
      [{ data: { value: 'expected 2' }, loading: false, networkStatus: 8, error: { errors: [{ message: 'Invalid query' }] }, previousData: { value: 'expected 2' } }],
      [{ data: { value: 'expected 2' }, loading: true, networkStatus: 4, previousData: { value: 'expected 2' } }],
      [{ data: { value: 'expected 3' }, loading: false, networkStatus: 7, previousData: { value: 'expected 2' } }]
    ]);
  }));

  describe('errorPolicy', () => {
    describe('errorPolicy: all', () => {
      it('should emit graphql errors and not throw on reobserve (errorPolicy: all)', waitForAsync(async () => {
        const errorFn = jest.fn();
        const query = gql`query { value }`;
        mockLink.addMockedResponse({ request: { query }, result: { errors: [new GraphQLError('Invalid query')] } });

        const queryObservable = apollo.watchQuery<{ value: string }>({ query, errorPolicy: 'all' });

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
        const query = gql`query { value }`;
        mockLink.addMockedResponse({ request: { query }, error: new Error('An unexpected error has occurred') });

        apollo.watchQuery<{ value: string }>({ query, errorPolicy: 'all' }).subscribe(result => {
          if (!result.loading) {
            expect(result.error?.message).toEqual('An unexpected error has occurred');
          }
        });
      }));

      it('should emit error with data (errorPolicy: all)', fakeAsync(() => {
        const mockFn = jest.fn();

        const query = gql`query { value value2 }`;
        mockLink.addMockedResponse({ request: { query }, result: { data: { value: 'expected 1' } } });
        mockLink.addMockedResponse({ request: { query }, result: { data: { value: 'expected 1' }, errors: [new GraphQLError('Invalid query')] } });

        const query$ = apollo.watchQuery<{ value: string }>({ query, errorPolicy: 'all' });

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
        const errorFn = jest.fn();
        const query = gql`query { value }`;
        mockLink.addMockedResponse({
          request: { query },
          result: { data: { value: 'expected' }, errors: [new GraphQLError('Invalid query')] }
        });

        const queryObservable = apollo.watchQuery<{ value: string }>({ query, errorPolicy: 'none' });

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

        expect(errorFn).toHaveBeenCalledWith(new Error('Invalid query'));
      }));
    });

    describe('errorPolicy: ignore', () => {
      it('should not emit graphql errors (errorPolicy: ignore)', waitForAsync(() => {
        const query = gql`query { value }`;
        mockLink.addMockedResponse({ request: { query }, result: { errors: [new GraphQLError('Invalid query')] } });

        apollo.watchQuery<{ value: string }>({ query, errorPolicy: 'ignore' }).subscribe(
          result => {
            if (!result.loading) {
              expect(result.error).toBeUndefined();
            }
          });
      }));

      it('should not emit network errors (errorPolicy: ignore)', waitForAsync(() => {
        const query = gql`query { value }`;
        mockLink.addMockedResponse({
          request: { query },
          error: new Error('An unexpected error has occurred')
        });

        apollo.watchQuery<{ value: string }>({ query, errorPolicy: 'ignore' }).subscribe(result => {
          expect(result.error).toBeUndefined();
        });
      }));
    });
  });
});
