import { fakeAsync, tick, waitForAsync } from '@angular/core/testing';
import { gql } from '@apollo/client/core';
import { GraphQLError } from 'graphql';
import { mockApollo } from './helpers';

describe('QueryObservable', () => {
  it('should emit loading and network status on subscription', fakeAsync(() => {
    const mockFn = jest.fn();
    const query = gql`query { value }`;
    const apollo = mockApollo([{
      request: { query },
      result: { data: { value: 'expected' } }
    }]);

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
  }));

  it('should emit current result on subscription', waitForAsync(() => {
    const apollo = mockApollo([]);

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

  it('should not emit emitInitial result (emitInitial: false)', fakeAsync(() => {
    const mockFn = jest.fn();
    const query = gql`query { value }`;
    const apollo = mockApollo([{
      request: { query },
      result: { data: { value: 'expected' } }
    }
    ]);

    apollo.watchQuery<{ value: string }>({ query, emitInitial: false }).subscribe(result => {
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
    const apollo = mockApollo([{
      request: { query },
      result: { data: { value: 'expected 1' } }
    }
    ]);

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
    const apollo = mockApollo([
      { request: { query }, result: { data: { value: 'expected 1' } } },
      { request: { query }, result: { data: { value: 'expected 2' } } }
    ]);

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
    const apollo = mockApollo([
      { request: { query }, result: { data: { value: 'expected 1' } } },
      { request: { query }, result: { data: { value: 'expected 2' } } }
    ]);

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

  describe('errorPolicy', () => {
    describe('errorPolicy: all', () => {
      it('should emit graphql errors (errorPolicy: all)', waitForAsync(() => {
        const query = gql`query { value }`;
        const apollo = mockApollo([
          { request: { query }, result: { errors: [new GraphQLError('Invalid query')] } }
        ]);

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
        const apollo = mockApollo([
          { request: { query }, error: new Error('An unexcpted error has occured') }
        ]);

        apollo.watchQuery<{ value: string }>({ query, errorPolicy: 'all', throwError: true }).subscribe({
          error: error => {
            expect(error?.message).toEqual('An unexcpted error has occured');
          }
        });
      }));

      it('should emit new result it contains errors without data (errorPolicy: all)', fakeAsync(() => {
        const mockFn = jest.fn();

        const query = gql`query { value }`;
        const apollo = mockApollo([
          { request: { query }, result: { data: { value: 'expected 1' } } },
          { request: { query }, result: { errors: [new GraphQLError('Invalid query')] } }
        ]);

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
      }));
    });

    describe('errorPolicy: none', () => {
      it('should throw graphql errors (errorPolicy: none)', waitForAsync(() => {
        const query = gql`query { value }`;
        const apollo = mockApollo([{
          request: { query },
          result: { errors: [new GraphQLError('Invalid query')] }
        }]);

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
        const apollo = mockApollo([{ request: { query }, result: { errors: [new GraphQLError('Invalid query')] } }
        ]);

        apollo.watchQuery<{ value: string }>({ query, errorPolicy: 'ignore', throwError: true }).subscribe(
          result => {
            if (!result.loading) {
              expect(!result.error).toEqual(true);
            }
          });
      }));

      it('should throw network errors (errorPolicy: ignore)', waitForAsync(() => {
        const query = gql`query { value }`;
        const apollo = mockApollo([{
          request: { query },
          error: new Error('An unexcpted error has occured')
        }]);

        apollo.watchQuery<{ value: string }>({ query, errorPolicy: 'ignore', throwError: true }).subscribe({
          error: error => {
            expect(error?.message).toEqual('An unexcpted error has occured');
          }
        });
      }));
    });

    describe('throwError: false', () => {
      it('should emit network errors (errorPolicy: ignore)', waitForAsync(() => {
        const query = gql`query { value }`;
        const apollo = mockApollo([{
          request: { query },
          error: new Error('An unexcpted error has occured')
        }]);

        apollo.watchQuery<{ value: string }>({ query, errorPolicy: 'ignore', throwError: false }).subscribe(
          result => {
            if (!result.loading) {
              expect(result.error?.message).toEqual('An unexcpted error has occured');
            }
          }
        );
      }));

      it('should emit graphql errors (errorPolicy: none)', waitForAsync(() => {
        const query = gql`query { value }`;
        const apollo = mockApollo([{
          request: { query },
          result: { errors: [new GraphQLError('Invalid query')] }
        }]);

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
        const apollo = mockApollo([{
          request: { query },
          error: new Error('An unexcpted error has occured')
        }]);

        apollo.watchQuery<{ value: string }>({ query, errorPolicy: 'none', throwError: false }).subscribe(
          result => {
            if (!result.loading) {
              expect(result.error?.message).toEqual('An unexcpted error has occured');
            }
          }
        );
      }));

      it('should emit network errors (errorPolicy: all)', waitForAsync(() => {
        const query = gql`query { value }`;
        const apollo = mockApollo([{
          request: { query },
          error: new Error('An unexcpted error has occured')
        }]);

        apollo.watchQuery<{ value: string }>({ query, errorPolicy: 'all', throwError: false }).subscribe(
          result => {
            if (!result.loading) {
              expect(result.error?.message).toEqual('An unexcpted error has occured');
            }
          }
        );
      }));
    });
  });
});
