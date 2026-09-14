import { inject, Injector, signal } from '@angular/core';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { Apollo } from '@apollo-orbit/angular';
import { ErrorLike, gql, TypedDocumentNode } from '@apollo/client';
import { MockLink, MockSubscriptionLink } from '@apollo/client/testing';
import { GraphQLError } from 'graphql';
import { provideApolloMock } from '../helpers/apollo-mock.provider';

type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };

interface Value {
  value: string;
}

describe('SignalMutation', () => {
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

  it('should reject on mutate error with an errorPolicy of none', async () => {
    const errorFn = vi.fn();
    const mutation = gql`mutation { updateValue }`;
    mockLink.addMockedResponse({
      request: { query: mutation },
      error: new TypeError('Failed to fetch')
    });

    const signalMutation = apollo.signal.mutation(mutation, { errorPolicy: 'none', onError: error => errorFn(error) });

    await expect(signalMutation.mutate()).rejects.toThrow('Failed to fetch');

    expect(signalMutation.loading()).toBe(false);
    expect(signalMutation.called()).toBe(true);
    expect(signalMutation.data()).toBeUndefined();
    expect(signalMutation.error()?.message).toContain('Failed to fetch');
    expect(errorFn).toHaveBeenCalledWith(expect.objectContaining({ message: 'Failed to fetch' }));
  });

  it('should resolve with the error on mutate error with an errorPolicy of all', async () => {
    const errorFn = vi.fn();
    const mutation = gql`mutation { updateValue }`;
    mockLink.addMockedResponse({
      request: { query: mutation },
      error: new TypeError('Failed to fetch')
    });

    const signalMutation = apollo.signal.mutation(mutation, { errorPolicy: 'all', onError: error => errorFn(error) });

    const result = await signalMutation.mutate();

    expect(result.data).toBeUndefined();
    expect(result.error?.message).toContain('Failed to fetch');
    expect(signalMutation.loading()).toBe(false);
    expect(signalMutation.called()).toBe(true);
    expect(signalMutation.error()?.message).toContain('Failed to fetch');
    expect(errorFn).toHaveBeenCalledWith(expect.objectContaining({ message: 'Failed to fetch' }));
  });

  it('should resolve without an error on mutate error with an errorPolicy of ignore', async () => {
    const mutation = gql`mutation { updateValue }`;
    mockLink.addMockedResponse({
      request: { query: mutation },
      error: new TypeError('Failed to fetch')
    });

    const signalMutation = apollo.signal.mutation(mutation, { errorPolicy: 'ignore' });

    const result = await signalMutation.mutate();

    expect(result.data).toBeUndefined();
    expect(signalMutation.called()).toBe(true);
    expect(signalMutation.error()).toBeUndefined();
  });

  it('should record the error when the returned promise is ignored', async () => {
    const mutation = gql`mutation { updateValue }`;
    mockLink.addMockedResponse({
      request: { query: mutation },
      error: new TypeError('Failed to fetch')
    });

    const signalMutation = apollo.signal.mutation(mutation);

    signalMutation.mutate();

    await new Promise(resolve => setTimeout(resolve, 10));

    expect(signalMutation.error()?.message).toContain('Failed to fetch');
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

  it('should call onCompleted callback on success', fakeAsync(() => {
    const onCompletedFn = vi.fn();
    const mutation = gql`mutation { updateValue }`;

    mockLink.addMockedResponse({
      request: { query: mutation },
      result: { data: { updateValue: 'success' } }
    });

    const signalMutation = apollo.signal.mutation(mutation, {
      onCompleted: onCompletedFn
    });

    signalMutation.mutate();
    tick();

    expect(onCompletedFn).toHaveBeenCalledWith(
      { updateValue: 'success' },
      expect.objectContaining({ mutation })
    );
  }));

  for (const errorPolicy of ['none', 'all'] as const) {
    it('should call onError callback on error', fakeAsync(() => {
      const onErrorFn = vi.fn();
      const mutation = gql`mutation { updateValue }`;

      mockLink.addMockedResponse({
        request: { query: mutation },
        result: { errors: [new GraphQLError('Mutation error')] }
      });

      const signalMutation = apollo.signal.mutation(mutation, {
        errorPolicy,
        onError: onErrorFn
      });

      signalMutation.mutate().catch(() => { });

      tick();

      expect(onErrorFn).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringContaining('Mutation error') }),
        expect.objectContaining({ mutation })
      );
    }));
  }

  describe('superseded executions and callbacks', () => {
    const mutation: TypedDocumentNode<{ update: string }, { id: string }> = gql`mutation Update($id: ID!) { update(id: $id) }`;

    it('should not let a discarded mutation overwrite a later one after reset', fakeAsync(() => {
      mockLink.addMockedResponse({ request: { query: mutation, variables: { id: 'slow' } }, result: { data: { update: 'slow' } }, delay: 40 });
      mockLink.addMockedResponse({ request: { query: mutation, variables: { id: 'fast' } }, result: { data: { update: 'fast' } }, delay: 5 });

      const signalMutation = apollo.signal.mutation(mutation);

      void signalMutation.mutate({ variables: { id: 'slow' } });
      signalMutation.reset();
      void signalMutation.mutate({ variables: { id: 'fast' } });

      tick(10);
      expect(signalMutation.data()).toEqual({ update: 'fast' });

      tick(60);
      expect(signalMutation.data()).toEqual({ update: 'fast' });
    }));

    it('should commit the result before invoking onCompleted', fakeAsync(() => {
      mockLink.addMockedResponse({ request: { query: mutation, variables: { id: '1' } }, result: { data: { update: 'ok' } }, delay: 5 });

      let seen: { loading: boolean; data: { update: string } | undefined } | undefined;

      const signalMutation = apollo.signal.mutation(mutation, {
        onCompleted: () => {
          seen = { loading: signalMutation.loading(), data: signalMutation.data() };
        }
      });

      void signalMutation.mutate({ variables: { id: '1' } });
      tick(10);

      expect(seen).toEqual({ loading: false, data: { update: 'ok' } });
    }));

    it('should not strand loading when onCompleted throws', fakeAsync(() => {
      mockLink.addMockedResponse({ request: { query: mutation, variables: { id: '1' } }, result: { data: { update: 'ok' } }, delay: 5 });

      const signalMutation = apollo.signal.mutation(mutation, {
        onCompleted: () => {
          throw new Error('callback failed');
        }
      });

      void signalMutation.mutate({ variables: { id: '1' } }).catch(() => undefined);
      tick(10);

      expect(signalMutation.loading()).toBe(false);
      expect(signalMutation.data()).toEqual({ update: 'ok' });
    }));
  });

  for (const errorPolicy of ['none', 'all', 'ignore'] as const) {
    it(`should preserve successful state when onCompleted throws under ${errorPolicy}`, async () => {
      const document: TypedDocumentNode<{ value: string }> = gql`mutation { value }`;
      mockLink.addMockedResponse({ request: { query: document }, result: { data: { value: 'saved' } } });

      const error = new Error('Callback failed');
      const onError = vi.fn();
      const signalMutation = apollo.signal.mutation(document, {
        errorPolicy,
        onError,
        onCompleted: () => {
          throw error;
        }
      });

      await expect(signalMutation.mutate()).rejects.toBe(error);

      expect(signalMutation.data()).toEqual({ value: 'saved' });
      expect(signalMutation.loading()).toBe(false);
      expect(signalMutation.error()).toBeUndefined();
      expect(onError).not.toHaveBeenCalled();
    });
  }
});
