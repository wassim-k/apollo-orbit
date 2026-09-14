import { Injector, PendingTasks, signal } from '@angular/core';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { Apollo } from '@apollo-orbit/angular';
import { gql, TypedDocumentNode } from '@apollo/client';
import { MockLink } from '@apollo/client/testing';
import { provideApolloMock } from './helpers/apollo-mock.provider';

interface Value {
  value: string;
}

describe('OperationTasks', () => {
  let apollo: Apollo;
  let mockLink: MockLink;
  let injector: Injector;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideApolloMock()]
    });

    apollo = TestBed.inject(Apollo);
    mockLink = TestBed.inject(MockLink);
    injector = TestBed.inject(Injector);
  });

  describe('Application stability', () => {
    /**
     * Counts the tasks a signal registers with `PendingTasks` and how many it releases. A task that is never
     * released leaves the application permanently unstable and stalls server-side rendering.
     */
    function trackPendingTasks(): { added: number; released: number } {
      const pendingTasks = TestBed.inject(PendingTasks);
      const counters = { added: 0, released: 0 };
      const add = pendingTasks.add.bind(pendingTasks);

      vi.spyOn(pendingTasks, 'add').mockImplementation(() => {
        counters.added++;
        const remove = add();
        let released = false;

        // `PendingTasks` cleanups are idempotent, so count removals rather than calls.
        return () => {
          if (!released) {
            released = true;
            counters.released++;
          }
          remove();
        };
      });

      return counters;
    }

    it('should release the pending task when a query is terminated mid-flight', fakeAsync(() => {
      const query = gql`query GetValue($id: ID!) { value(id: $id) }`;

      mockLink.addMockedResponse({
        request: { query, variables: { id: '1' } },
        result: { data: { value: 'value-1' } },
        delay: 50
      });

      const tasks = trackPendingTasks();
      const variables = signal<{ id: string } | null>({ id: '1' });

      const signalQuery = apollo.signal.query({ query, variables, injector });

      tick(0);
      expect(tasks).toEqual({ added: 1, released: 0 });

      // Terminating abandons the in-flight `reobserve`, so the task must be released now rather than when the
      // response that is no longer needed arrives.
      signalQuery.terminate();
      expect(tasks).toEqual({ added: 1, released: 1 });

      tick(50);
      expect(tasks).toEqual({ added: 1, released: 1 });
    }));

    it('should release the pending task when the query document changes', fakeAsync(() => {
      interface Values {
        value?: string;
        other?: string;
      }

      const valueQuery: TypedDocumentNode<Values> = gql`query GetValue { value }`;
      const otherQuery: TypedDocumentNode<Values> = gql`query GetOther { other }`;

      mockLink.addMockedResponse({
        request: { query: valueQuery },
        result: { data: { value: 'expected' } },
        delay: 50
      });

      mockLink.addMockedResponse({
        request: { query: otherQuery },
        result: { data: { other: 'other' } },
        delay: 50
      });

      const tasks = trackPendingTasks();
      const other = signal(false);

      const signalQuery = apollo.signal.query({ query: () => other() ? otherQuery : valueQuery, injector });

      tick(0);
      expect(tasks).toEqual({ added: 1, released: 0 });

      tick(50);
      expect(tasks).toEqual({ added: 1, released: 1 });

      // A document change is a real request, so it registers a task of its own rather than fetching unobserved.
      other.set(true);
      tick(0);
      expect(tasks).toEqual({ added: 2, released: 1 });

      tick(50);
      expect(tasks).toEqual({ added: 2, released: 2 });
      expect(signalQuery.data()).toEqual({ other: 'other' });
    }));

    it('should release the pending task when the variables change', fakeAsync(() => {
      const query: TypedDocumentNode<Value, { id: string }> = gql`query GetValue($id: ID!) { value(id: $id) }`;

      for (const id of ['1', '2']) {
        mockLink.addMockedResponse({
          request: { query, variables: { id } },
          result: { data: { value: id } },
          delay: 50
        });
      }

      const tasks = trackPendingTasks();
      const id = signal('1');

      const signalQuery = apollo.signal.query({ query, variables: () => ({ id: id() }), injector });

      tick(50);
      expect(tasks).toEqual({ added: 1, released: 1 });

      id.set('2');
      tick(0);
      expect(tasks).toEqual({ added: 2, released: 1 });

      tick(50);
      expect(tasks).toEqual({ added: 2, released: 2 });
      expect(signalQuery.data()).toEqual({ value: '2' });
    }));

    it('should release the pending task of a single query execution superseded by a cache hit', fakeAsync(() => {
      const query: TypedDocumentNode<Value, { id: string }> = gql`query GetValue($id: ID!) { value(id: $id) }`;

      mockLink.addMockedResponse({
        request: { query, variables: { id: '1' } },
        result: { data: { value: 'value-1' } },
        delay: 50
      });

      apollo.cache.writeQuery({ query, variables: { id: '2' }, data: { value: 'value-2' } });

      const tasks = trackPendingTasks();
      const singleQuery = apollo.signal.query.once({ query, lazy: true, injector });

      void singleQuery.execute({ variables: { id: '1' } });
      tick(0);
      expect(tasks).toEqual({ added: 1, released: 0 });

      // Answered from the cache, so Apollo leaves the superseded request running unless its observable is stopped.
      void singleQuery.execute({ variables: { id: '2' } });
      tick(0);

      expect(tasks).toEqual({ added: 2, released: 2 });
      expect(singleQuery.data()).toEqual({ value: 'value-2' });

      tick(50);
    }));

    it('should release the pending task when a single query is terminated mid-flight', fakeAsync(() => {
      const query: TypedDocumentNode<Value> = gql`query { value }`;

      mockLink.addMockedResponse({
        request: { query },
        result: { data: { value: 'expected' } },
        delay: 50
      });

      const tasks = trackPendingTasks();
      const singleQuery = apollo.signal.query.once({ query, injector });

      tick(0);
      expect(tasks).toEqual({ added: 1, released: 0 });

      singleQuery.terminate();
      expect(tasks).toEqual({ added: 1, released: 1 });

      tick(50);
      expect(tasks).toEqual({ added: 1, released: 1 });
    }));

    it('should release the pending tasks a refetch and a fetchMore add', fakeAsync(() => {
      interface BooksData {
        books: Array<{ id: string }>;
      }

      const query: TypedDocumentNode<BooksData> = gql`query GetBooks($offset: Int) { books(offset: $offset) { id } }`;

      mockLink.addMockedResponse({
        request: { query, variables: { offset: 0 } },
        result: { data: { books: [{ id: '1' }] } }
      });

      const tasks = trackPendingTasks();
      const signalQuery = apollo.signal.query({ query, variables: () => ({ offset: 0 }), injector });

      tick();
      expect(tasks).toEqual({ added: 1, released: 1 });

      mockLink.addMockedResponse({
        request: { query, variables: { offset: 0 } },
        result: { data: { books: [{ id: '1' }] } },
        delay: 50
      });

      mockLink.addMockedResponse({
        request: { query, variables: { offset: 1 } },
        result: { data: { books: [{ id: '2' }] } },
        delay: 50
      });

      signalQuery.refetch();
      signalQuery.fetchMore({
        variables: { offset: 1 },
        updateQuery: (prev, { fetchMoreResult }) => ({
          books: [...prev.books, ...fetchMoreResult.books]
        })
      });

      expect(tasks).toEqual({ added: 3, released: 1 });

      tick(50);
      expect(tasks).toEqual({ added: 3, released: 3 });
    }));

    it('should release the refetch and fetchMore pending tasks when the query is terminated mid-flight', fakeAsync(() => {
      interface BooksData {
        books: Array<{ id: string }>;
      }

      const query: TypedDocumentNode<BooksData> = gql`query GetBooks($offset: Int) { books(offset: $offset) { id } }`;

      mockLink.addMockedResponse({
        request: { query, variables: { offset: 0 } },
        result: { data: { books: [{ id: '1' }] } }
      });

      const tasks = trackPendingTasks();
      const signalQuery = apollo.signal.query({ query, variables: () => ({ offset: 0 }), injector });

      tick();
      expect(tasks).toEqual({ added: 1, released: 1 });

      mockLink.addMockedResponse({
        request: { query, variables: { offset: 0 } },
        result: { data: { books: [{ id: '1' }] } },
        delay: 50
      });

      mockLink.addMockedResponse({
        request: { query, variables: { offset: 1 } },
        result: { data: { books: [{ id: '2' }] } },
        delay: 50
      });

      signalQuery.refetch();
      signalQuery.fetchMore({
        variables: { offset: 1 },
        updateQuery: (prev, { fetchMoreResult }) => ({
          books: [...prev.books, ...fetchMoreResult.books]
        })
      });

      expect(tasks).toEqual({ added: 3, released: 1 });

      signalQuery.terminate();
      expect(tasks).toEqual({ added: 3, released: 3 });

      tick(50);
      expect(tasks).toEqual({ added: 3, released: 3 });
    }));
  });
});
