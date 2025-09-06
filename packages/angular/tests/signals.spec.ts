import { Injector, signal } from '@angular/core';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { Apollo } from '@apollo-orbit/angular';
import { gql, NetworkStatus, TypedDocumentNode } from '@apollo/client';
import { MockLink, MockSubscriptionLink } from '@apollo/client/testing';
import { GraphQLError } from 'graphql';
import { Exact } from './graphql';
import { provideApolloMock } from './helpers/apollo-mock.provider';

interface Value {
  value: string;
}

interface Book {
  id: string;
  name: string;
}

describe('Signals', () => {
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

  describe('SignalQuery', () => {
    it('should create a signal query and update with results', fakeAsync(() => {
      const query = gql`query { value }`;
      mockLink.addMockedResponse({
        request: { query },
        result: { data: { value: 'expected' } },
        delay: 10
      });

      const signalQuery = apollo.signal.query<Value>({
        query,
        injector
      });

      expect(signalQuery.loading()).toBe(false);
      expect(signalQuery.data()).toBeUndefined();
      expect(signalQuery.error()).toBeUndefined();
      expect(signalQuery.networkStatus()).toBe(NetworkStatus.ready);

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

    it('should refetch query and update signals', fakeAsync(() => {
      const query = gql`query { value }`;

      mockLink.addMockedResponse({
        request: { query },
        result: { data: { value: 'initial' } }
      });

      mockLink.addMockedResponse({
        request: { query },
        result: { data: { value: 'updated' } },
        delay: 5
      });

      const signalQuery = apollo.signal.query<Value>({
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
      const query = gql`query { value }`;
      mockLink.addMockedResponse({
        request: { query },
        result: { errors: [new GraphQLError('Query error')] }
      });

      const signalQuery = apollo.signal.query<Value>({
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

    for (const notifyOnLoading of [true, false]) {
      it(`notifyOnLoading: ${notifyOnLoading}`, fakeAsync(() => {
        const query = gql`query { value }`;
        mockLink.addMockedResponse({
          request: { query },
          result: { data: { value: 'test' } },
          delay: 10
        });

        const signalQuery = apollo.signal.query<Value>({ injector, query, notifyOnLoading });

        tick(0);

        expect(signalQuery.loading()).toBe(notifyOnLoading);

        tick(10);

        expect(signalQuery.loading()).toBe(false);
        expect(signalQuery.data()).toEqual({ value: 'test' });
      }));
    }

    describe('lazy', () => {
      it('should not execute query until explicitly called', fakeAsync(() => {
        const query = gql`query { value }`;
        mockLink.addMockedResponse({
          request: { query },
          result: { data: { value: 'expected' } }
        });

        const lazyQuery = apollo.signal.query<Value>({ injector, query, lazy: true });

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
        const query = gql`query { value }`;

        mockLink.addMockedResponse({
          request: { query },
          result: { data: { value: 'expected' } }
        });

        const lazyQuery = apollo.signal.query<Value>({ injector, query, lazy: true });
        expect(lazyQuery.active()).toBe(false);

        const result = await lazyQuery.execute();

        expect(lazyQuery.loading()).toBe(false);
        expect(lazyQuery.data()).toEqual({ value: 'expected' });
        expect(lazyQuery.active()).toBe(true);
        expect(result.data).toEqual({ value: 'expected' });
      });

      it('should resolve promise on query error (errorPolicy: \'none\')', async () => {
        const errorFn = jest.fn();

        const query = gql`query { value }`;

        mockLink.addMockedResponse({
          request: { query },
          error: new TypeError('Failed to fetch')
        });

        const lazyQuery = apollo.signal.query<Value>({ injector, query, lazy: true, errorPolicy: 'none' });
        expect(lazyQuery.active()).toBe(false);

        try {
          await lazyQuery.execute();
        } catch (error) {
          errorFn(error);
        }

        expect(lazyQuery.loading()).toBe(false);
        expect(lazyQuery.data()).toBeUndefined();
        expect(lazyQuery.active()).toBe(true);
        expect(lazyQuery.error()).toEqual(new TypeError('Failed to fetch'));
        expect(errorFn).toHaveBeenCalledWith(new TypeError('Failed to fetch'));
      });

      it('should support returning error result from execute', async () => {
        const query = gql`query { value }`;

        mockLink.addMockedResponse({
          request: { query },
          result: { errors: [new GraphQLError('Query error')] }
        });

        const lazyQuery = apollo.signal.query<Value>({ injector, query, lazy: true });
        expect(lazyQuery.active()).toBe(false);

        const result = await lazyQuery.execute();

        expect(lazyQuery.loading()).toBe(false);
        expect(lazyQuery.active()).toBe(true);
        expect(lazyQuery.error()?.message).toEqual('Query error');
        expect(result.error?.message).toEqual('Query error');
      });

      it('should throw when methods are called before execution', () => {
        const query = gql`query { value }`;
        const lazyQuery = apollo.signal.query<Value>({ injector, query, lazy: true });

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

      for (const notifyOnLoading of [true, false]) {
        it(`notifyOnLoading: ${notifyOnLoading}`, fakeAsync(() => {
          const query = gql`query { value }`;
          mockLink.addMockedResponse({
            request: { query },
            result: { data: { value: 'test' } },
            delay: 10
          });

          const lazyQuery = apollo.signal.query<Value>({ injector, query, notifyOnLoading, lazy: true });

          expect(lazyQuery.loading()).toBe(false);

          lazyQuery.execute();

          expect(lazyQuery.loading()).toBe(notifyOnLoading);

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
        expect(signalQuery.result()).toEqual({ data: undefined, dataState: 'empty', loading: false, networkStatus: NetworkStatus.ready });
        tick();
        expect(signalQuery.data()).toEqual({ book: { id: 1, name: 'Book 1' } });

        // Cache updates should be reflected while query is active
        apollo.cache.writeQuery({ query, data: { book: { id: 1, name: 'Book 1 v2' } }, variables: { id: 1 } });
        tick();
        expect(signalQuery.data()).toEqual({ book: { id: 1, name: 'Book 1 v2' } });

        // Setting variables to null should terminate the query
        id.set(null);
        tick();

        // Cache updates should NOT be reflected after query is terminated
        apollo.cache.writeQuery({ query, data: { book: { id: 1, name: 'Book 1 v3' } }, variables: { id: 1 } });
        tick();
        expect(signalQuery.data()).toEqual({ book: { id: 1, name: 'Book 1 v2' } });

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

        // Manual termination stops the query
        signalQuery.terminate();

        // Changing variables while terminated has no effect
        id.set(null);
        tick();

        id.set(2);
        tick();
        // Data remains unchanged from last successful query
        expect(signalQuery.data()).toEqual({ book: { id: 1, name: 'Book 1' } });

        mockLink.addMockedResponse({
          request: { query, variables: { id: 2 } },
          result: { data: { book: { id: 2, name: 'Book 2' } } }
        });

        // Manual execution restarts the query with current variables
        signalQuery.execute();
        tick();
        expect(signalQuery.data()).toEqual({ book: { id: 2, name: 'Book 2' } });

        mockLink.addMockedResponse({
          request: { query, variables: { id: 3 } },
          result: { data: { book: { id: 3, name: 'Book 3' } } }
        });

        // After manual execution, query responds to variable changes again
        id.set(3);
        tick();
        expect(signalQuery.data()).toEqual({ book: { id: 3, name: 'Book 3' } });
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

        // Variables become null - should terminate
        id.set(null);
        tick();
        expect(lazyQuery.active()).toBe(false);
        expect(lazyQuery.data()).toEqual({ book: { id: 1, name: 'Book 1' } });

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

        // Variables become null again - should terminate
        id.set(null);
        tick();
        expect(lazyQuery.active()).toBe(false);

        // Cache updates should not affect the query while terminated
        apollo.cache.writeQuery({
          query,
          variables: { id: 2 },
          data: { book: { id: 2, name: 'Book 2 Updated Again' } }
        });
        tick();
        expect(lazyQuery.data()).toEqual({ book: { id: 2, name: 'Book 2 Updated' } });

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
    });

    describe('variables type safety', () => {
      const query: TypedDocumentNode<{ value: string }, { id: string }> = gql`query Value($id: ID!) { value(id: $id) }`;
      const queryOptional: TypedDocumentNode<{ value: string }, Exact<{ id?: string }>> = gql`query Value($id: ID) { value(id: $id) }`;

      it('should raise a compiler error if variables are required but not provided (and not lazy)', () => {
        // @ts-expect-error: Property 'variables' is missing in type
        apollo.signal.query({ injector, query });
        // @ts-expect-error: Property 'variables' is missing in type
        apollo.signal.query({ injector, query, lazy: false });
      });

      it('should compile if lazy is true, even if required variables are not provided initially', () => {
        apollo.signal.query({ injector, query, lazy: true });
      });

      it('should compile if required variables are provided (and not lazy)', () => {
        apollo.signal.query({ injector, query, variables: () => ({ id: '1' }) });
      });

      it('should compile with optional variables', () => {
        apollo.signal.query({ injector, query: queryOptional });
        apollo.signal.query({ injector, query: queryOptional, variables: () => ({ id: '1' }) });
      });
    });
  });

  describe('SignalFragment', () => {
    it('should watch fragment data and update when cache changes', fakeAsync(() => {
      const bookFragment = gql`
        fragment BookFragment on Book {
          id
          name
        }
      `;

      // Write a Book object to the cache
      apollo.cache.writeFragment({
        id: 'Book:1',
        fragment: bookFragment,
        data: {
          __typename: 'Book',
          id: '1',
          name: 'Book 1'
        }
      });

      // Create signal fragment
      const fragment = apollo.signal.fragment<Book>({
        fragment: bookFragment,
        from: 'Book:1',
        injector
      });

      tick();

      expect(fragment.data()).toEqual({
        __typename: 'Book',
        id: '1',
        name: 'Book 1'
      });
      expect(fragment.complete()).toBe(true);

      // Update the fragment data in cache
      apollo.cache.writeFragment({
        id: 'Book:1',
        fragment: bookFragment,
        data: {
          __typename: 'Book',
          id: '1',
          name: 'Updated Book'
        }
      });

      tick();

      expect(fragment.data()).toEqual({
        __typename: 'Book',
        id: '1',
        name: 'Updated Book'
      });
    }));

    it('should create fragments with different reference IDs', fakeAsync(() => {
      const bookFragment = gql`
        fragment BookFragment on Book {
          id
          name
        }
      `;

      apollo.cache.writeFragment({
        id: 'Book:1',
        fragment: bookFragment,
        data: {
          __typename: 'Book',
          id: '1',
          name: 'Book 1'
        }
      });

      apollo.cache.writeFragment({
        id: 'Book:2',
        fragment: bookFragment,
        data: {
          __typename: 'Book',
          id: '2',
          name: 'Book 2'
        }
      });

      const fragment = apollo.signal.fragment<Book>({
        fragment: bookFragment,
        from: () => 'Book:1',
        injector
      });

      tick();
      expect(fragment.data().name).toBe('Book 1');

      const newFragment = apollo.signal.fragment<Book>({
        fragment: bookFragment,
        from: 'Book:2',
        injector
      });

      tick();

      expect(newFragment.data().name).toBe('Book 2');
    }));
  });

  describe('SignalMutation', () => {
    it('should perform mutation and track result state', fakeAsync(() => {
      const mutation = gql`mutation UpdateValue($value: String!) { updateValue(value: $value) }`;
      mockLink.addMockedResponse({
        request: { query: mutation, variables: { value: 'new value' } },
        result: { data: { updateValue: 'success' } },
        delay: 10
      });

      const signalMutation = apollo.signal.mutation(mutation);

      expect(signalMutation.loading()).toBe(false);
      expect(signalMutation.called()).toBe(false);
      expect(signalMutation.data()).toBeUndefined();

      signalMutation.mutate({ variables: { value: 'new value' } });

      expect(signalMutation.loading()).toBe(true);
      expect(signalMutation.called()).toBe(true);

      tick(10);

      expect(signalMutation.loading()).toBe(false);
      expect(signalMutation.called()).toBe(true);
      expect(signalMutation.data()).toEqual({ updateValue: 'success' });
    }));

    it('should handle mutation errors', fakeAsync(() => {
      const mutation = gql`mutation { updateValue }`;
      mockLink.addMockedResponse({
        request: { query: mutation },
        result: { errors: [new GraphQLError('Mutation error')] }
      });

      const signalMutation = apollo.signal.mutation(mutation);
      signalMutation.mutate();

      tick();

      expect(signalMutation.loading()).toBe(false);
      expect(signalMutation.called()).toBe(true);
      expect(signalMutation.data()).toBeUndefined();
      expect(signalMutation.error()).toBeDefined();
      expect(signalMutation.error()?.message).toContain('Mutation error');
    }));

    it('should reject promise on mutation error (errorPolicy: \'none\')', async () => {
      const errorFn = jest.fn();
      const mutation = gql`mutation { updateValue }`;
      mockLink.addMockedResponse({
        request: { query: mutation },
        error: new TypeError('Failed to fetch')
      });

      const signalMutation = apollo.signal.mutation(mutation, { errorPolicy: 'none' });

      try {
        await signalMutation.mutate();
      } catch (error) {
        errorFn(error);
      }

      expect(signalMutation.loading()).toBe(false);
      expect(signalMutation.called()).toBe(true);
      expect(signalMutation.data()).toBeUndefined();
      expect(signalMutation.error()).toBeDefined();
      expect(signalMutation.error()?.message).toContain('Failed to fetch');
      expect(errorFn).toHaveBeenCalledWith(expect.objectContaining({ message: 'Failed to fetch' }));
    });

    it('should reset mutation state', fakeAsync(() => {
      const mutation = gql`mutation { updateValue }`;
      mockLink.addMockedResponse({
        request: { query: mutation },
        result: { data: { updateValue: 'success' } }
      });

      const signalMutation = apollo.signal.mutation(mutation);
      signalMutation.mutate();

      tick();

      expect(signalMutation.called()).toBe(true);
      expect(signalMutation.data()).toEqual({ updateValue: 'success' });

      signalMutation.reset();

      expect(signalMutation.called()).toBe(false);
      expect(signalMutation.data()).toBeUndefined();
      expect(signalMutation.error()).toBeUndefined();
    }));

    it('should call onData callback on success', fakeAsync(() => {
      const onDataFn = jest.fn();
      const mutation = gql`mutation { updateValue }`;

      mockLink.addMockedResponse({
        request: { query: mutation },
        result: { data: { updateValue: 'success' } }
      });

      const signalMutation = apollo.signal.mutation(mutation, {
        onData: onDataFn
      });

      signalMutation.mutate();
      tick();

      expect(onDataFn).toHaveBeenCalledWith(
        { updateValue: 'success' },
        expect.objectContaining({ mutation })
      );
    }));

    it('should call onError callback on error', fakeAsync(() => {
      const onErrorFn = jest.fn();
      const mutation = gql`mutation { updateValue }`;

      mockLink.addMockedResponse({
        request: { query: mutation },
        result: { errors: [new GraphQLError('Mutation error')] }
      });

      const signalMutation = apollo.signal.mutation(mutation, {
        onError: onErrorFn
      });

      signalMutation.mutate();

      tick();

      expect(onErrorFn).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringContaining('Mutation error') }),
        expect.objectContaining({ mutation })
      );
    }));

    it('should enforce type safety of variables', () => {
      const mutation: TypedDocumentNode<{ updateValue: boolean }, Exact<{ value: string }>> = gql`mutation UpdateValue($value: String!) { updateValue(value: $value) }`;

      const signalMutation = apollo.signal.mutation(mutation);

      mockLink.addMockedResponse({
        request: { query: mutation },
        result: { data: { updateValue: true } }
      });

      // @ts-expect-error: variables is missing
      signalMutation.mutate();

      mockLink.addMockedResponse({
        request: { query: mutation, variables: {} },
        result: { data: { updateValue: true } }
      });

      // @ts-expect-error: variables is missing
      signalMutation.mutate({});

      mockLink.addMockedResponse({
        request: { query: mutation, variables: { value: 'test' } },
        result: { data: { updateValue: true } }
      });

      signalMutation.mutate({ variables: { value: 'test' } });
    });
  });

  describe('SignalSubscription', () => {
    it('should receive subscription data', fakeAsync(() => {
      const subscription = gql`subscription { newValue }`;

      const signalSubscription = apollo.signal.subscription<{ newValue: string }>({
        subscription,
        injector
      });

      expect(signalSubscription.loading()).toBe(false);
      expect(signalSubscription.data()).toBeUndefined();

      mockSubscriptionLink.simulateResult({
        result: { data: { newValue: 'value1' } },
        delay: 10
      });

      tick(0);
      expect(signalSubscription.loading()).toBe(true);

      tick(10);
      expect(signalSubscription.loading()).toBe(false);
      expect(signalSubscription.data()).toEqual({ newValue: 'value1' });

      mockSubscriptionLink.simulateResult({
        result: { data: { newValue: 'value2' } }
      });

      tick();

      expect(signalSubscription.data()).toEqual({ newValue: 'value2' });
    }));

    it('should handle subscription errors', fakeAsync(() => {
      const subscription = gql`subscription { newValue }`;
      const onErrorFn = jest.fn();

      const signalSubscription = apollo.signal.subscription<{ newValue: string }>({
        subscription,
        onError: onErrorFn,
        injector
      });

      mockSubscriptionLink.simulateResult({
        result: { errors: [new GraphQLError('Subscription error')] }
      });

      tick();

      expect(signalSubscription.loading()).toBe(false);
      expect(signalSubscription.data()).toBeUndefined();
      expect(signalSubscription.error()).toBeDefined();
      expect(signalSubscription.error()?.message).toContain('Subscription error');
      expect(onErrorFn).toHaveBeenCalled();
    }));

    it('should restart subscription', fakeAsync(() => {
      const subscription = gql`subscription { newValue }`;
      const onDataFn = jest.fn();

      const signalSubscription = apollo.signal.subscription<{ newValue: string }>({
        subscription,
        onData: onDataFn,
        injector
      });

      mockSubscriptionLink.simulateResult({
        result: { data: { newValue: 'value1' } }
      });

      tick();
      expect(onDataFn).toHaveBeenCalledWith({ newValue: 'value1' });

      signalSubscription.execute();

      mockSubscriptionLink.simulateResult({
        result: { data: { newValue: 'value2' } }
      });

      tick();

      expect(onDataFn).toHaveBeenCalledTimes(2);
      expect(onDataFn).toHaveBeenNthCalledWith(2, { newValue: 'value2' });
      expect(signalSubscription.data()).toEqual({ newValue: 'value2' });
    }));

    it('should call callbacks on subscription events', fakeAsync(() => {
      const subscription = gql`subscription { newValue }`;
      const onDataFn = jest.fn();
      const onErrorFn = jest.fn();
      const onCompleteFn = jest.fn();

      const signalSubscription = apollo.signal.subscription<{ newValue: string }>({
        subscription,
        onData: onDataFn,
        onError: onErrorFn,
        onComplete: onCompleteFn,
        injector
      });

      mockSubscriptionLink.simulateResult({
        result: { data: { newValue: 'value1' } }
      });
      tick();
      expect(onDataFn).toHaveBeenCalledWith({ newValue: 'value1' });

      mockSubscriptionLink.simulateResult({
        result: { errors: [new GraphQLError('Subscription error')] }
      });
      tick();
      expect(onErrorFn).toHaveBeenCalled();

      mockSubscriptionLink.simulateComplete();
      tick();
      expect(onCompleteFn).toHaveBeenCalled();

      expect(signalSubscription.active()).toBe(false);
    }));

    it('should restart subscription with new variables', fakeAsync(() => {
      const subscription = gql`subscription NewValue($id: ID!) { newValue(id: $id) }`;
      const id = signal('1');

      const signalSubscription = apollo.signal.subscription<{ newValue: string }>({
        subscription,
        variables: () => ({ id: id() }),
        injector
      });

      mockSubscriptionLink.simulateResult({
        result: { data: { newValue: 'value-for-id-1' } }
      });

      tick();

      expect(mockSubscriptionLink.operation?.variables).toEqual({ id: '1' });
      expect(signalSubscription.data()?.newValue).toBe('value-for-id-1');

      id.set('2');

      tick();

      // Reset result on variables change.
      expect(signalSubscription.loading()).toBe(true);
      expect(signalSubscription.data()).toBe(undefined);

      mockSubscriptionLink.simulateResult({
        result: { data: { newValue: 'value-for-id-2' } }
      });

      tick();

      expect(mockSubscriptionLink.operation?.variables).toEqual({ id: '2' });
      expect(signalSubscription.data()?.newValue).toBe('value-for-id-2');
    }));

    describe('lazy', () => {
      it('should start subscription immediately when lazy is false (default)', fakeAsync(() => {
        const subscription = gql`subscription { newValue }`;

        const signalSubscription = apollo.signal.subscription<{ newValue: string }>({
          subscription,
          injector
        });

        tick();

        expect(signalSubscription.active()).toBe(true);
        expect(signalSubscription.loading()).toBe(true);
        expect(mockSubscriptionLink.operation).toBeDefined();
      }));

      it('should not start subscription when lazy is true', fakeAsync(() => {
        const subscription = gql`subscription { newValue }`;

        const signalSubscription = apollo.signal.subscription<{ newValue: string }>({
          subscription,
          lazy: true,
          injector
        });

        expect(signalSubscription.active()).toBe(false);
        expect(signalSubscription.loading()).toBe(false);
        expect(mockSubscriptionLink.operation).toBeUndefined();
      }));

      it('should support manually starting a lazy subscription', fakeAsync(() => {
        const subscription = gql`subscription { newValue }`;
        const onDataFn = jest.fn();

        const signalSubscription = apollo.signal.subscription<{ newValue: string }>({
          subscription,
          lazy: true,
          onData: onDataFn,
          injector
        });

        tick();

        expect(signalSubscription.active()).toBe(false);
        expect(signalSubscription.loading()).toBe(false);
        expect(mockSubscriptionLink.operation).toBeUndefined();

        signalSubscription.execute();

        tick();

        expect(signalSubscription.active()).toBe(true);
        expect(signalSubscription.loading()).toBe(true);
        expect(mockSubscriptionLink.operation).toBeDefined();

        mockSubscriptionLink.simulateResult({
          result: { data: { newValue: 'value1' } }
        });

        tick();

        expect(signalSubscription.loading()).toBe(false);
        expect(signalSubscription.data()).toEqual({ newValue: 'value1' });
        expect(onDataFn).toHaveBeenCalledWith({ newValue: 'value1' });
      }));

      it('should start lazy subscription with exec options', fakeAsync(() => {
        const subscription = gql`subscription TestSub($id: ID!) { newValue(id: $id) }`;

        const signalSubscription = apollo.signal.subscription<{ newValue: string }, { id: string }>({
          subscription,
          lazy: true,
          injector
        });

        signalSubscription.execute({ variables: { id: '123' } });

        expect(mockSubscriptionLink.operation).toBeDefined();
        expect(mockSubscriptionLink.operation?.variables).toEqual({ id: '123' });

        mockSubscriptionLink.simulateResult({
          result: { data: { newValue: 'value-for-123' } }
        });

        tick();

        expect(signalSubscription.data()).toEqual({ newValue: 'value-for-123' });
      }));

      it('should stop and restart a subscription', fakeAsync(() => {
        const subscription = gql`subscription { newValue }`;

        const signalSubscription = apollo.signal.subscription<{ newValue: string }>({
          subscription,
          injector
        });

        tick();
        expect(signalSubscription.active()).toBe(true);

        signalSubscription.terminate();

        tick();
        expect(signalSubscription.active()).toBe(false);

        mockSubscriptionLink.simulateResult({
          result: { data: { newValue: 'new-value-after-restart' } }
        });

        signalSubscription.execute();

        expect(signalSubscription.active()).toBe(true);

        tick();

        expect(signalSubscription.data()).toEqual({ newValue: 'new-value-after-restart' });
      }));
    });

    describe('variables nullability', () => {
      it('should not execute subscription until variables are non-null', fakeAsync(() => {
        const subscription = gql`subscription GetBookUpdates($id: Int!) { 
          bookUpdated(id: $id) { id name } 
        }`;

        const id = signal<number | null>(null);

        const signalSubscription = apollo.signal.subscription({
          subscription,
          variables: () => id() !== null ? ({ id: id() }) : null,
          injector
        });

        expect(signalSubscription.result()).toEqual({ loading: false, data: undefined, error: undefined });
        expect(signalSubscription.active()).toBe(false);
        tick();
        expect(signalSubscription.result()).toEqual({ loading: false, data: undefined, error: undefined });
        expect(signalSubscription.active()).toBe(false);

        // Verify no subscription was initiated
        expect(mockSubscriptionLink.operation).toBeUndefined();

        // Set variables to non-null
        id.set(1);
        tick();

        expect(signalSubscription.active()).toBe(true);
        expect(signalSubscription.loading()).toBe(true);

        mockSubscriptionLink.simulateResult({
          result: { data: { bookUpdated: { id: 1, name: 'Book 1' } } }
        });

        tick();

        expect(signalSubscription.data()).toEqual({
          bookUpdated: { id: 1, name: 'Book 1' }
        });
      }));

      it('should terminate subscription when variables become null', fakeAsync(() => {
        const subscription = gql`subscription GetBookUpdates($id: Int!) { 
          bookUpdated(id: $id) { id name } 
        }`;

        const id = signal<number | null>(1);

        const signalSubscription = apollo.signal.subscription({
          subscription,
          variables: () => id() !== null ? ({ id: id() }) : null,
          injector
        });

        tick();
        expect(signalSubscription.active()).toBe(true);

        mockSubscriptionLink.simulateResult({
          result: { data: { bookUpdated: { id: 1, name: 'Book 1' } } }
        });

        tick();
        expect(signalSubscription.data()).toEqual({ bookUpdated: { id: 1, name: 'Book 1' } });

        // Update data while subscription is active
        mockSubscriptionLink.simulateResult({
          result: { data: { bookUpdated: { id: 1, name: 'Book 1 v2' } } }
        });
        tick();
        expect(signalSubscription.data()).toEqual({ bookUpdated: { id: 1, name: 'Book 1 v2' } });

        // Set variables to null - should terminate subscription
        id.set(null);
        tick();

        expect(signalSubscription.active()).toBe(false);

        // Data should remain from last successful result
        expect(signalSubscription.data()).toEqual({ bookUpdated: { id: 1, name: 'Book 1 v2' } });

        // Simulate new results - should not update since subscription is terminated
        mockSubscriptionLink.simulateResult({
          result: { data: { bookUpdated: { id: 1, name: 'Book 1 v3' } } }
        });
        tick();
        expect(signalSubscription.data()).toEqual({ bookUpdated: { id: 1, name: 'Book 1 v2' } });

        // Set variables back to non-null - should restart subscription
        id.set(1);
        tick();
        expect(signalSubscription.active()).toBe(true);

        mockSubscriptionLink.simulateResult({
          result: { data: { bookUpdated: { id: 1, name: 'Book 1 v4' } } }
        });
        tick();
        expect(signalSubscription.data()).toEqual({ bookUpdated: { id: 1, name: 'Book 1 v4' } });
      }));

      it('should support variables nullability with manual execution/termination', fakeAsync(() => {
        const subscription = gql`subscription GetBookUpdates($id: Int!) { 
          bookUpdated(id: $id) { id name } 
        }`;

        const id = signal<number | null>(1);

        const signalSubscription = apollo.signal.subscription({
          subscription,
          variables: () => id() !== null ? ({ id: id() }) : null,
          injector
        });

        tick();
        expect(signalSubscription.active()).toBe(true);

        mockSubscriptionLink.simulateResult({
          result: { data: { bookUpdated: { id: 1, name: 'Book 1' } } }
        });
        tick();
        expect(signalSubscription.data()).toEqual({ bookUpdated: { id: 1, name: 'Book 1' } });

        // Manually terminate
        signalSubscription.terminate();
        expect(signalSubscription.active()).toBe(false);

        // Change variables while terminated
        id.set(null);
        tick();

        id.set(2);
        tick();

        // Data should not update since subscription is terminated
        expect(signalSubscription.data()).toEqual({ bookUpdated: { id: 1, name: 'Book 1' } });

        // Manually execute with new variables
        signalSubscription.execute();
        tick();
        expect(signalSubscription.active()).toBe(true);

        mockSubscriptionLink.simulateResult({
          result: { data: { bookUpdated: { id: 2, name: 'Book 2' } } }
        });
        tick();
        expect(signalSubscription.data()).toEqual({ bookUpdated: { id: 2, name: 'Book 2' } });

        // Variables change should restart subscription automatically when active
        id.set(3);
        tick();
        expect(signalSubscription.active()).toBe(true);

        mockSubscriptionLink.simulateResult({
          result: { data: { bookUpdated: { id: 3, name: 'Book 3' } } }
        });
        tick();
        expect(signalSubscription.data()).toEqual({ bookUpdated: { id: 3, name: 'Book 3' } });
      }));

      it('should handle variables nullability with lazy subscription', fakeAsync(() => {
        const subscription = gql`subscription GetBookUpdates($id: Int!) { 
          bookUpdated(id: $id) { id name } 
        }`;

        const id = signal<number | null>(null);

        const signalSubscription = apollo.signal.subscription({
          subscription,
          lazy: true,
          variables: () => id() !== null ? ({ id: id() }) : null,
          injector
        });

        // Should not start subscription when lazy and variables are null
        tick();
        expect(signalSubscription.active()).toBe(false);
        expect(mockSubscriptionLink.operation).toBeUndefined();

        // Set variables to non-null - should still not start (lazy)
        id.set(1);
        tick();
        expect(signalSubscription.active()).toBe(false);

        // Manually execute
        signalSubscription.execute();
        tick();
        expect(signalSubscription.active()).toBe(true);

        mockSubscriptionLink.simulateResult({
          result: { data: { bookUpdated: { id: 1, name: 'Book 1' } } }
        });
        tick();
        expect(signalSubscription.data()).toEqual({ bookUpdated: { id: 1, name: 'Book 1' } });

        // Variables become null - should terminate
        id.set(null);
        tick();
        expect(signalSubscription.active()).toBe(false);

        // Variables become non-null again - should start (since execute was called manually and intentionally)
        id.set(2);
        tick();
        expect(signalSubscription.active()).toBe(true);

        mockSubscriptionLink.simulateResult({
          result: { data: { bookUpdated: { id: 2, name: 'Book 2' } } }
        });
        tick();
        expect(signalSubscription.data()).toEqual({ bookUpdated: { id: 2, name: 'Book 2' } });
      }));
    });

    describe('variables type safety', () => {
      const subscription: TypedDocumentNode<{ value: string }, { id: string }> = gql`subscription Value($id: ID!) { value(id: $id) }`;
      const subscriptionOptional: TypedDocumentNode<{ value: string }, { id?: string }> = gql`subscription Value($id: ID) { value(id: $id) }`;

      it('should raise a compiler error if variables are required but not provided (and not lazy)', () => {
        // @ts-expect-error: Property 'variables' is missing in type
        apollo.signal.subscription({ injector, subscription });
        // @ts-expect-error: Property 'variables' is missing in type
        apollo.signal.subscription({ injector, subscription, lazy: false });
      });

      it('should compile if lazy is true, even if required variables are not provided initially', () => {
        apollo.signal.subscription({ injector, subscription, lazy: true });
      });

      it('should compile if required variables are provided (and not lazy)', () => {
        apollo.signal.subscription({ injector, subscription, variables: () => ({ id: '1' }) });
      });

      it('should compile with optional variables', () => {
        apollo.signal.subscription({ injector, subscription: subscriptionOptional });
        apollo.signal.subscription({ injector, subscription: subscriptionOptional, variables: () => ({ id: '1' }) });
      });
    });
  });

  describe('SignalCacheQuery', () => {
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

      // Create signal cache query with partial data enabled
      const cacheQuery = apollo.signal.cacheQuery({
        query,
        returnPartialData: true,
        injector
      });

      tick();

      expect(cacheQuery.complete()).toBe(false);
      expect(cacheQuery.data()).toEqual({
        book: {
          __typename: 'Book',
          id: '1',
          name: 'Book with missing author'
        }
      });
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
  });
});
