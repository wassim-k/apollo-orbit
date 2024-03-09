import { fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { Apollo } from '@apollo-orbit/angular/core';
import { gql, NetworkStatus } from '@apollo/client/core';
import { MockLink } from '@apollo/client/testing/core';
import { GraphQLError } from 'graphql';
import { ApolloMockModule } from './helpers';

describe('QueryObservable', () => {
  let apollo: Apollo;
  let mockLink: MockLink;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ApolloMockModule]
    });

    apollo = TestBed.inject(Apollo);
    mockLink = TestBed.inject(MockLink);
  });

  it('should emit loading and network status on subscription', fakeAsync(() => {
    const mockFn = jest.fn();
    const query = gql`query { value }`;
    mockLink.addMockedResponse({
      request: { query },
      result: { data: { value: 'expected' } }
    });

    apollo.watchQuery<{ value: string }>({ query }).subscribe(result => {
      mockFn(result);
    });

    tick(10);

    expect(mockFn.mock.calls).toMatchObject([
      [{
        loading: true,
        networkStatus: 1
      }],
      [{
        data: { value: 'expected' },
        loading: false,
        networkStatus: 7
      }]
    ]);

    tick(100); // auto-clean
  }));

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

  it('should not emit loading (notifyOnLoading: false)', fakeAsync(() => {
    const mockFn = jest.fn();
    const query = gql`query { value }`;
    mockLink.addMockedResponse({
      request: { query },
      result: { data: { value: 'expected' } }
    });

    apollo.watchQuery<{ value: string }>({ query, notifyOnLoading: false }).subscribe(result => {
      mockFn(result);
    });

    tick(10);

    expect(mockFn.mock.calls).toMatchObject([
      [{
        data: { value: 'expected' },
        networkStatus: 7
      }]
    ]);

    tick(100); // auto-clean
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

    tick(100); // auto-clean
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

    tick(100); // auto-clean
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

    tick(100); // auto-clean
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
    const subscription = queryObservable.subscribe(mockFn);

    tick();

    queryObservable.refetch();
    tick();
    tick(10);

    subscription.unsubscribe();

    expect(mockFn.mock.calls).toMatchObject([
      [{
        loading: true,
        networkStatus: NetworkStatus.loading
      }],
      [{
        loading: false,
        networkStatus: NetworkStatus.ready,
        data: { value: 'expected 1' }
      }],
      [{
        loading: true,
        networkStatus: NetworkStatus.refetch,
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
    queryObservable.subscribe(mockFn);
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
      [{ data: { value: 'expected 2' }, loading: false, networkStatus: 8, error: { graphQLErrors: [{ message: 'Invalid query' }] }, previousData: { value: 'expected 2' } }],
      [{ data: { value: 'expected 2' }, loading: true, networkStatus: 4, previousData: { value: 'expected 2' } }],
      [{ data: { value: 'expected 3' }, loading: false, networkStatus: 7, previousData: { value: 'expected 2' } }]
    ]);

    tick(100); // auto-clean
  }));

  describe('errorPolicy', () => {
    describe('errorPolicy: all', () => {
      it('should emit graphql errors (errorPolicy: all)', waitForAsync(() => {
        const query = gql`query { value }`;
        mockLink.addMockedResponse({ request: { query }, result: { errors: [new GraphQLError('Invalid query')] } });

        apollo.watchQuery<{ value: string }>({ query, errorPolicy: 'all', throwError: true }).subscribe(
          result => {
            if (!result.loading) {
              expect(result.error?.message).toEqual('Invalid query');
            }
          }
        );
      }));

      it('should throw network error (errorPolicy: all)', waitForAsync(() => {
        const query = gql`query { value }`;
        mockLink.addMockedResponse({ request: { query }, error: new Error('An unexpected error has occurred') });

        apollo.watchQuery<{ value: string }>({ query, errorPolicy: 'all', throwError: true }).subscribe({
          error: error => {
            expect(error?.message).toEqual('An unexpected error has occurred');
          }
        });
      }));

      it('should emit new result it contains errors without data (errorPolicy: all)', fakeAsync(() => {
        const mockFn = jest.fn();

        const query = gql`query { value }`;
        mockLink.addMockedResponse({ request: { query }, result: { data: { value: 'expected 1' } } });
        mockLink.addMockedResponse({ request: { query }, result: { errors: [new GraphQLError('Invalid query')] } });

        const query$ = apollo.watchQuery<{ value: string }>({ query, errorPolicy: 'all', throwError: true });

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

        expect(mockFn.mock.calls).toEqual([[{ value: 'expected 1', error: undefined }], [{ value: 'expected 1', error: 'Invalid query' }]]);

        tick(100); // auto-clean
      }));
    });

    describe('errorPolicy: none', () => {
      it('should throw graphql errors (errorPolicy: none)', waitForAsync(() => {
        const query = gql`query { value }`;
        mockLink.addMockedResponse({
          request: { query },
          result: { errors: [new GraphQLError('Invalid query')] }
        });

        apollo.watchQuery<{ value: string }>({ query, errorPolicy: 'none', throwError: true }).subscribe({
          error: error => {
            expect(error?.message).toEqual('Invalid query');
          }
        });
      }));
    });

    describe('errorPolicy: ignore', () => {
      it('should not emit graphql errors (errorPolicy: ignore)', waitForAsync(() => {
        const query = gql`query { value }`;
        mockLink.addMockedResponse({ request: { query }, result: { errors: [new GraphQLError('Invalid query')] } });

        apollo.watchQuery<{ value: string }>({ query, errorPolicy: 'ignore', throwError: true }).subscribe(
          result => {
            if (!result.loading) {
              expect(!result.error).toEqual(true);
            }
          });
      }));

      it('should throw network errors (errorPolicy: ignore)', waitForAsync(() => {
        const query = gql`query { value }`;
        mockLink.addMockedResponse({
          request: { query },
          error: new Error('An unexpected error has occurred')
        });

        apollo.watchQuery<{ value: string }>({ query, errorPolicy: 'ignore', throwError: true }).subscribe({
          error: error => {
            expect(error?.message).toEqual('An unexpected error has occurred');
          }
        });
      }));
    });

    describe('throwError: false', () => {
      it('should emit network errors (errorPolicy: ignore)', waitForAsync(() => {
        const query = gql`query { value }`;
        mockLink.addMockedResponse({
          request: { query },
          error: new Error('An unexpected error has occurred')
        });

        apollo.watchQuery<{ value: string }>({ query, errorPolicy: 'ignore', throwError: false }).subscribe(
          result => {
            if (!result.loading) {
              expect(result.error?.message).toEqual('An unexpected error has occurred');
            }
          }
        );
      }));

      it('should emit graphql errors (errorPolicy: none)', waitForAsync(() => {
        const query = gql`query { value }`;
        mockLink.addMockedResponse({
          request: { query },
          result: { errors: [new GraphQLError('Invalid query')] }
        });

        apollo.watchQuery<{ value: string }>({ query, errorPolicy: 'none', throwError: false }).subscribe(
          result => {
            if (!result.loading) {
              expect(result.error?.message).toEqual('Invalid query');
            }
          }
        );
      }));

      it('should emit network errors (errorPolicy: none)', waitForAsync(() => {
        const query = gql`query { value }`;
        mockLink.addMockedResponse({
          request: { query },
          error: new Error('An unexpected error has occurred')
        });

        apollo.watchQuery<{ value: string }>({ query, errorPolicy: 'none', throwError: false }).subscribe(
          result => {
            if (!result.loading) {
              expect(result.error?.message).toEqual('An unexpected error has occurred');
            }
          }
        );
      }));

      it('should emit network errors (errorPolicy: all)', waitForAsync(() => {
        const query = gql`query { value }`;
        mockLink.addMockedResponse({
          request: { query },
          error: new Error('An unexpected error has occurred')
        });

        apollo.watchQuery<{ value: string }>({ query, errorPolicy: 'all', throwError: false }).subscribe(
          result => {
            if (!result.loading) {
              expect(result.error?.message).toEqual('An unexpected error has occurred');
            }
          }
        );
      }));
    });
  });
});
