import { ApplicationRef, Component, inject, Injector, input, signal } from '@angular/core';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { Apollo, SingleQueryResult } from '@apollo-orbit/angular';
import { ErrorLike, gql, NetworkStatus, OperationVariables, TypedDocumentNode } from '@apollo/client';
import { MockLink, MockSubscriptionLink } from '@apollo/client/testing';
import { GraphQLError } from 'graphql';
import { provideApolloMock } from '../helpers/apollo-mock.provider';

interface Value {
  value: string;
}

describe('SignalSingleQuery', () => {
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

  it('should fetch once and ignore later cache updates', fakeAsync(() => {
    const query: TypedDocumentNode<Value> = gql`query { value }`;

    mockLink.addMockedResponse({
      request: { query },
      result: { data: { value: 'initial' } },
      delay: 10
    });

    const singleQuery = apollo.signal.query.once({ query, injector });
    const watchQuery = apollo.signal.query({ query, injector });

    tick(0);
    expect(singleQuery.loading()).toBe(true);
    expect(singleQuery.data()).toBeUndefined();

    tick(10);
    expect(singleQuery.loading()).toBe(false);
    expect(singleQuery.data()).toEqual({ value: 'initial' });
    expect(watchQuery.data()).toEqual({ value: 'initial' });

    apollo.cache.writeQuery({ query, data: { value: 'external' } });
    tick();

    expect(watchQuery.data()).toEqual({ value: 'external' });
    expect(singleQuery.data()).toEqual({ value: 'initial' });
    expect(singleQuery.error()).toBeUndefined();
  }));

  it('should re-execute when variables change', fakeAsync(() => {
    const query = gql`query GetValue($id: ID!) { value(id: $id) }`;

    mockLink.addMockedResponse({
      request: { query, variables: { id: '1' } },
      result: { data: { value: 'value-1' } }
    });

    mockLink.addMockedResponse({
      request: { query, variables: { id: '2' } },
      result: { data: { value: 'value-2' } }
    });

    const variables = signal({ id: '1' });
    const singleQuery = apollo.signal.query.once({ query, variables, injector });

    tick();
    expect(singleQuery.data()).toEqual({ value: 'value-1' });

    variables.set({ id: '2' });
    tick();

    expect(singleQuery.data()).toEqual({ value: 'value-2' });
    expect(singleQuery.previousData()).toEqual({ value: 'value-1' });
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

    const singleQuery = apollo.signal.query.once({ query, variables: () => ({ id: '1' }), injector });

    tick();

    expect(singleQuery.variables()).toEqual({ id: '1' });
    expect(singleQuery.data()).toEqual({ value: 'value-1' });

    TestBed.tick();
    tick();

    expect(requestedVariables).toEqual([{ id: '1' }]);
  }));

  it('should ignore results from a superseded execution', fakeAsync(() => {
    const query = gql`query GetValue($id: ID!) { value(id: $id) }`;

    mockLink.addMockedResponse({
      request: { query, variables: { id: '1' } },
      result: { data: { value: 'value-1' } },
      delay: 50
    });

    mockLink.addMockedResponse({
      request: { query, variables: { id: '2' } },
      result: { data: { value: 'value-2' } },
      delay: 10
    });

    const variables = signal({ id: '1' });
    const singleQuery = apollo.signal.query.once({ query, variables, injector });

    tick(5);
    variables.set({ id: '2' });
    tick(10);

    expect(singleQuery.data()).toEqual({ value: 'value-2' });

    tick(50);
    expect(singleQuery.data()).toEqual({ value: 'value-2' });
  }));

  it('should execute once when executed manually before the first effect run', fakeAsync(() => {
    const query: TypedDocumentNode<Value> = gql`query { value }`;

    mockLink.addMockedResponse({
      request: { query },
      result: { data: { value: 'expected' } }
    });

    const querySpy = vi.spyOn(apollo.client, 'watchQuery');
    const singleQuery = apollo.signal.query.once({ query, injector });

    let result: SingleQueryResult<Value> | undefined;
    singleQuery.execute().then(executed => {
      result = executed;
    });
    tick();

    expect(querySpy).toHaveBeenCalledTimes(1);
    expect(result?.data).toEqual({ value: 'expected' });
    expect(singleQuery.data()).toEqual({ value: 'expected' });
  }));

  it('should report active while an execution is in flight', fakeAsync(() => {
    const query: TypedDocumentNode<Value> = gql`query { value }`;

    mockLink.addMockedResponse({
      request: { query },
      result: { data: { value: 'expected' } },
      delay: 10
    });

    const singleQuery = apollo.signal.query.once({ query, injector });

    expect(singleQuery.active()).toBe(false);

    tick(0);
    expect(singleQuery.active()).toBe(true);

    tick(10);
    expect(singleQuery.active()).toBe(true);

    singleQuery.terminate();
    expect(singleQuery.active()).toBe(false);
    expect(singleQuery.enabled()).toBe(false);
  }));

  it('should leave the signals to the newest execution when variables supersede an in-flight one', fakeAsync(() => {
    const query: TypedDocumentNode<Value, { id: string }> = gql`query GetValue($id: ID!) { value(id: $id) }`;

    mockLink.addMockedResponse({
      request: { query, variables: { id: '1' } },
      result: { data: { value: 'value-1' } },
      delay: 50
    });

    mockLink.addMockedResponse({
      request: { query, variables: { id: '2' } },
      result: { data: { value: 'value-2' } },
      delay: 10
    });

    const variables = signal({ id: '1' });
    const singleQuery = apollo.signal.query.once({ query, variables, lazy: true, injector });

    singleQuery.execute().catch(() => undefined);

    tick(5);
    variables.set({ id: '2' });
    tick(60);

    // Only the newest execution owns the signals, so the superseded one never reaches them.
    expect(singleQuery.data()).toEqual({ value: 'value-2' });
  }));

  it('should reject an execution terminated mid-flight and reset the signals', fakeAsync(() => {
    const query: TypedDocumentNode<Value> = gql`query { value }`;

    mockLink.addMockedResponse({
      request: { query },
      result: { data: { value: 'expected' } },
      delay: 50
    });

    const singleQuery = apollo.signal.query.once({ query, lazy: true, injector });

    let terminated: unknown;
    singleQuery.execute().catch((error: unknown) => {
      terminated = error;
    });

    tick(5);
    singleQuery.terminate();
    tick(50);

    expect(terminated).toMatchObject({ name: 'AbortError' });
    expect(singleQuery.data()).toBeUndefined();
    expect(singleQuery.active()).toBe(false);
  }));

  it('should resolve a skipped execution without a cancellation error with an errorPolicy of all', async () => {
    const query: TypedDocumentNode<Value> = gql`query { value }`;

    const singleQuery = apollo.signal.query.once({
      query,
      variables: () => null,
      errorPolicy: 'all',
      injector
    });

    await expect(singleQuery.execute()).resolves.toEqual({ data: undefined, error: undefined });
    expect(singleQuery.active()).toBe(false);
  });

  it('should terminate when variables become null and reject a skipped execution', fakeAsync(() => {
    const query = gql`query GetValue($id: ID!) { value(id: $id) }`;

    mockLink.addMockedResponse({
      request: { query, variables: { id: '1' } },
      result: { data: { value: 'value-1' } }
    });

    const id = signal<string | null>('1');

    const singleQuery = apollo.signal.query.once({
      query,
      variables: () => id() !== null ? ({ id: id() }) : null,
      injector
    });

    tick();
    expect(singleQuery.data()).toEqual({ value: 'value-1' });
    expect(singleQuery.networkStatus()).toBe(NetworkStatus.ready);
    expect(singleQuery.active()).toBe(true);

    // Setting variables to null terminates the execution, data resets and previousData keeps the last value
    id.set(null);
    tick();

    expect(singleQuery.active()).toBe(false);
    expect(singleQuery.data()).toBeUndefined();
    expect(singleQuery.previousData()).toEqual({ value: 'value-1' });

    // Executing with null variables runs nothing, so there is no result to report
    let cancelled: unknown;
    singleQuery.execute().catch((error: unknown) => {
      cancelled = error;
    });
    tick();

    expect(cancelled).toMatchObject({ name: 'AbortError' });
    expect(singleQuery.active()).toBe(false);
  }));

  it('should not execute while variables are null or the query is terminated', fakeAsync(() => {
    const query = gql`query GetValue($id: ID!) { value(id: $id) }`;

    const querySpy = vi.spyOn(apollo.client, 'watchQuery');
    const id = signal<string | null>(null);

    const singleQuery = apollo.signal.query.once({
      query,
      variables: () => id() !== null ? ({ id: id() }) : null,
      injector
    });

    // Starting with null variables leaves nothing to execute and nothing to terminate
    tick();
    expect(querySpy).not.toHaveBeenCalled();
    expect(singleQuery.active()).toBe(false);

    // Once terminated, variable changes are ignored
    singleQuery.terminate();
    id.set('1');
    tick();

    expect(querySpy).not.toHaveBeenCalled();
    expect(singleQuery.enabled()).toBe(false);
  }));

  it('should expose errors on the result', fakeAsync(() => {
    const query: TypedDocumentNode<Value> = gql`query { value }`;

    mockLink.addMockedResponse({
      request: { query },
      result: { errors: [new GraphQLError('Query error')] }
    });

    const singleQuery = apollo.signal.query.once({ query, injector });

    tick();

    expect(singleQuery.loading()).toBe(false);
    expect(singleQuery.data()).toBeUndefined();
    expect(singleQuery.error()?.message).toContain('Query error');
  }));

  it('should not carry an execution context into the next execution', fakeAsync(() => {
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

    const singleQuery = apollo.signal.query.once({ query, fetchPolicy: 'network-only', lazy: true, injector });

    void singleQuery.execute({ context: { tag: 'first' } });
    tick();

    // Each execution gets its own observable, or Apollo would merge this context into the next execution.
    void singleQuery.execute();
    tick();

    expect(requestedContexts).toEqual(['first', undefined]);
  }));

  it('should execute lazily and resolve with the result', async () => {
    const query: TypedDocumentNode<Value> = gql`query { value }`;

    mockLink.addMockedResponse({
      request: { query },
      result: { data: { value: 'expected' } }
    });

    const singleQuery = apollo.signal.query.once({ query, lazy: true, injector });

    expect(singleQuery.enabled()).toBe(false);
    expect(singleQuery.data()).toBeUndefined();

    const result = await singleQuery.execute();

    expect(result.data).toEqual({ value: 'expected' });
    expect(singleQuery.data()).toEqual({ value: 'expected' });
    expect(singleQuery.enabled()).toBe(true);
  });

  describe('initial loading state', () => {
    const query: TypedDocumentNode<Value> = gql`query { value }`;
    it('should report loading for a single query before it reaches its observable', fakeAsync(() => {
      mockLink.addMockedResponse({ request: { query }, result: { data: { value: 'expected' } }, delay: 10 });

      const singleQuery = apollo.signal.query.once({ query, injector });

      expect(singleQuery.loading()).toBe(true);
      expect(singleQuery.networkStatus()).toBe(NetworkStatus.loading);

      tick(10);

      expect(singleQuery.loading()).toBe(false);
      expect(singleQuery.data()).toEqual({ value: 'expected' });
    }));

    it('should not report loading for a lazy single query', fakeAsync(() => {
      const singleQuery = apollo.signal.query.once({ query, lazy: true, injector });

      expect(singleQuery.loading()).toBe(false);

      tick(0);

      expect(singleQuery.loading()).toBe(false);
    }));
  });

  describe('termination', () => {
    const query: TypedDocumentNode<Value> = gql`query { value }`;

    it('should clear initial loading when variables become null before the first effect and resume later', fakeAsync(() => {
      const request = vi.spyOn(mockLink, 'request');
      const variables = signal<{ id: string } | null>({ id: '1' });
      const keyed: TypedDocumentNode<Value, { id: string }> = gql`query Value($id: ID!) { value(id: $id) }`;
      const singleQuery = apollo.signal.query.once({ query: keyed, variables, injector });

      expect(singleQuery.loading()).toBe(true);
      variables.set(null);
      tick();

      expect(singleQuery.loading()).toBe(false);
      expect(singleQuery.networkStatus()).toBe(NetworkStatus.ready);
      expect(singleQuery.enabled()).toBe(true);
      expect(singleQuery.active()).toBe(false);
      expect(request).not.toHaveBeenCalled();

      mockLink.addMockedResponse({ request: { query: keyed, variables: { id: '2' } }, result: { data: { value: 'resumed' } } });
      variables.set({ id: '2' });
      tick();

      expect(singleQuery.data()).toEqual({ value: 'resumed' });
      expect(request).toHaveBeenCalledOnce();
    }));

    it('should clear the loading state when terminated before the first effect', fakeAsync(() => {
      mockLink.addMockedResponse({ request: { query }, result: { data: { value: 'expected' } }, delay: 10 });

      const singleQuery = apollo.signal.query.once({ query, injector });

      singleQuery.terminate();
      tick(50);

      expect(singleQuery.loading()).toBe(false);
      expect(singleQuery.networkStatus()).toBe(NetworkStatus.ready);
    }));

    it('should clear a loading state that was already read', fakeAsync(() => {
      const singleQuery = apollo.signal.query.once({ query, injector });

      expect(singleQuery.loading()).toBe(true);

      singleQuery.terminate();
      tick();

      expect(singleQuery.loading()).toBe(false);
      expect(singleQuery.active()).toBe(false);
    }));

    it('should keep the same result and previous data when terminated repeatedly', fakeAsync(() => {
      mockLink.addMockedResponse({ request: { query }, result: { data: { value: 'expected' } }, delay: 10 });

      const singleQuery = apollo.signal.query.once({ query, injector });

      tick(10);

      singleQuery.terminate();
      const cleared = singleQuery.result();

      singleQuery.terminate();

      expect(singleQuery.result()).toBe(cleared);
      expect(singleQuery.previousData()).toEqual({ value: 'expected' });
    }));
  });

  describe('required inputs', () => {
    const keyed: TypedDocumentNode<Value, { id: string }> = gql`query Q($id: ID!) { value(id: $id) }`;

    @Component({ template: '', standalone: true })
    class Host {
      public readonly id = input.required<string>();
      public readonly query = inject(Apollo).signal.query.once({ query: keyed, variables: () => ({ id: this.id() }) });
    }

    it('should not read variables before the component receives its inputs', () => {
      const fixture = TestBed.createComponent(Host);

      fixture.componentRef.setInput('id', '1');

      expect(fixture.componentInstance.query.variables()).toEqual({ id: '1' });
    });
  });

  // An abort raised by the transport belongs to the running execution, not to a superseded one.
  it('should settle a transport abort and release application stability', fakeAsync(() => {
    const query: TypedDocumentNode<Value> = gql`query { value }`;
    const error = new DOMException('Transport aborted', 'AbortError');
    mockLink.addMockedResponse({ request: { query }, error, delay: 10 });

    const singleQuery = apollo.signal.query.once({ query, injector, lazy: true });
    const rejected = vi.fn();
    let stable = true;

    const stability = TestBed.inject(ApplicationRef).isStable.subscribe(value => {
      stable = value;
    });

    singleQuery.execute().catch(rejected);

    expect(stable).toBe(false);

    tick(10);

    expect(rejected).toHaveBeenCalledWith(error);
    expect(singleQuery.loading()).toBe(false);
    expect(singleQuery.error()).toBe(error);
    expect(stable).toBe(true);

    stability.unsubscribe();
  }));

  it('should resolve a cache-only miss without data', async () => {
    const query: TypedDocumentNode<Value> = gql`query { value }`;
    const singleQuery = apollo.signal.query.once({ query, injector, lazy: true, fetchPolicy: 'cache-only' });

    expect((await singleQuery.execute()).data).toBeUndefined();
    expect(singleQuery.loading()).toBe(false);
  });
});
