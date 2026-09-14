import { Component, inject, Injector, input, signal } from '@angular/core';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { Apollo, InMemoryCache, provideApollo, withApolloOptions } from '@apollo-orbit/angular';
import { ApolloLink, Observable as ApolloObservable, gql, OperationVariables, TypedDocumentNode } from '@apollo/client';
import { MockLink, MockSubscriptionLink } from '@apollo/client/testing';
import { GraphQLError } from 'graphql';
import { Observable, Subject } from 'rxjs';
import { provideApolloMock } from '../helpers/apollo-mock.provider';

interface Value {
  value: string;
}

interface Book {
  id: string;
  name: string;
}

describe('SignalSubscription', () => {
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

  it('should receive subscription data', fakeAsync(() => {
    const subscription = gql`subscription { newValue }`;

    const signalSubscription = apollo.signal.subscription<{ newValue: string }>({
      subscription,
      injector
    });

    expect(signalSubscription.loading()).toBe(true);
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
    const onErrorFn = vi.fn();

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

  it('should handle subscription stream errors', fakeAsync(() => {
    const subscription = gql`subscription { newValue }`;
    const onErrorFn = vi.fn();

    const signalSubscription = apollo.signal.subscription<{ newValue: string }>({
      subscription,
      onError: onErrorFn,
      injector
    });

    tick(); // Ensure subscription is established

    mockSubscriptionLink.simulateResult({
      error: new Error('Network error')
    });

    tick();

    expect(signalSubscription.loading()).toBe(false);
    expect(signalSubscription.data()).toBeUndefined();
    expect(signalSubscription.error()).toBeDefined();
    expect(signalSubscription.error()?.message).toBe('Network error');
    expect(onErrorFn).toHaveBeenCalledWith(expect.objectContaining({ message: 'Network error' }));
  }));

  it('should restart subscription', fakeAsync(() => {
    const subscription = gql`subscription { newValue }`;
    const onDataFn = vi.fn();

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
    const onDataFn = vi.fn();
    const onErrorFn = vi.fn();
    const onCompleteFn = vi.fn();

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

  it('should subscribe once with a variables function that reads nothing reactive', fakeAsync(() => {
    const subscription: TypedDocumentNode<{ newValue: string }, { id: string }> = gql`subscription NewValue($id: ID!) { newValue(id: $id) }`;

    const requestedVariables: Array<OperationVariables> = [];
    const request = mockSubscriptionLink.request.bind(mockSubscriptionLink);
    mockSubscriptionLink.request = operation => {
      requestedVariables.push(operation.variables);
      return request(operation);
    };

    const signalSubscription = apollo.signal.subscription({ subscription, variables: () => ({ id: '1' }), injector });

    mockSubscriptionLink.simulateResult({ result: { data: { newValue: 'value-for-id-1' } } });
    tick();

    expect(signalSubscription.variables()).toEqual({ id: '1' });
    expect(signalSubscription.data()).toEqual({ newValue: 'value-for-id-1' });

    TestBed.tick();
    tick();

    expect(requestedVariables).toEqual([{ id: '1' }]);
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
      const onDataFn = vi.fn();

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

    it('should resubscribe when variables return to the value they left', fakeAsync(() => {
      const subscription = gql`subscription GetBookUpdates($id: Int!) { bookUpdated(id: $id) { id name } }`;
      const bookVariables = { id: 1 };
      const watching = signal(true);

      const signalSubscription = apollo.signal.subscription({
        subscription,
        variables: () => watching() ? bookVariables : null,
        injector
      });

      tick();

      expect(signalSubscription.active()).toBe(true);

      watching.set(false);
      tick();

      expect(signalSubscription.active()).toBe(false);

      watching.set(true);
      tick();

      expect(signalSubscription.active()).toBe(true);

      mockSubscriptionLink.simulateResult({
        result: { data: { bookUpdated: { id: 1, name: 'Book 1' } } }
      });
      tick();

      expect(signalSubscription.data()).toEqual({ bookUpdated: { id: 1, name: 'Book 1' } });
    }));
  });

  describe('single subscription per trigger', () => {
    it('should subscribe exactly once on initialization', fakeAsync(() => {
      const subscription = gql`subscription { newValue }`;

      const subscribeSpy = vi.spyOn(apollo, 'subscribe');

      apollo.signal.subscription<{ newValue: string }>({
        subscription,
        injector
      });

      tick();

      expect(subscribeSpy).toHaveBeenCalledTimes(1);
    }));

    it('should subscribe exactly once when executed manually before the first effect run', fakeAsync(() => {
      const subscription = gql`subscription { newValue }`;

      const subscribeSpy = vi.spyOn(apollo, 'subscribe');

      const signalSubscription = apollo.signal.subscription<{ newValue: string }>({
        subscription,
        lazy: true,
        injector
      });

      signalSubscription.execute();
      tick();

      expect(subscribeSpy).toHaveBeenCalledTimes(1);
    }));
  });

  describe('execute with null variables', () => {
    it('should handle execute when variables are null', fakeAsync(() => {
      const subscription = gql`subscription BookUpdated($id: Int!) { bookUpdated(id: $id) { id } }`;

      const id = signal<number | null>(null);

      const signalSubscription = apollo.signal.subscription({
        subscription,
        variables: () => id() !== null ? ({ id: id() }) : null,
        injector
      });

      // Execute when variables are null - should return early
      signalSubscription.execute();
      tick();

      expect(signalSubscription.active()).toBe(false);
    }));
  });

  describe('initial loading state', () => {
    const query: TypedDocumentNode<Value> = gql`query { value }`;
    it('should not report loading for a lazy subscription', fakeAsync(() => {
      const signalSubscription = apollo.signal.subscription<{ newValue: string }>({
        subscription: gql`subscription { newValue }`,
        lazy: true,
        injector
      });

      expect(signalSubscription.loading()).toBe(false);

      tick(0);

      expect(signalSubscription.loading()).toBe(false);
    }));
  });

  describe('completing streams', () => {
    const subscription = gql`subscription { newValue }`;

    it.each([true, false])('should preserve execution from onComplete and clean up the old stream (synchronous: %s)', synchronous => {
      fakeAsync(() => {
        const firstStream = new Subject<{ data: { newValue: string } }>();
        const secondStream = new Subject<{ data: { newValue: string } }>();
        const teardown = vi.fn();
        const subscribe = vi.spyOn(apollo, 'subscribe')
          .mockReturnValueOnce(new Observable(subscriber => {
            const source = firstStream.subscribe(subscriber);
            if (synchronous) firstStream.complete();
            return () => {
              source.unsubscribe();
              teardown();
            };
          }))
          .mockReturnValue(secondStream);
        const signalSubscription = apollo.signal.subscription({
          subscription,
          injector,
          lazy: true,
          onComplete: (): void => signalSubscription.execute()
        });

        signalSubscription.execute();
        if (!synchronous) firstStream.complete();
        tick();

        expect(subscribe).toHaveBeenCalledTimes(2);
        expect(teardown).toHaveBeenCalledOnce();
        expect(signalSubscription.active()).toBe(true);
        expect(signalSubscription.loading()).toBe(true);

        secondStream.next({ data: { newValue: 'second' } });
        expect(signalSubscription.data()).toEqual({ newValue: 'second' });
      })();
    });

    it('should execute variables changed immediately before the previous stream completes', fakeAsync(() => {
      const firstStream = new Subject<{ data: { value: string } }>();
      const secondStream = new Subject<{ data: { value: string } }>();
      const subscribe = vi.spyOn(apollo, 'subscribe')
        .mockReturnValueOnce(firstStream)
        .mockReturnValue(secondStream);
      const signalSubscription = apollo.signal.subscription({
        subscription: gql`subscription Value($id: ID!) { value(id: $id) }`,
        variables: () => ({ id: '1' }),
        injector
      });

      tick();
      signalSubscription.variables.set({ id: '2' });
      firstStream.complete();
      tick();

      expect(subscribe).toHaveBeenCalledTimes(2);
      expect(subscribe.mock.calls[1][0].variables).toEqual({ id: '2' });
      expect(signalSubscription.active()).toBe(true);

      secondStream.next({ data: { value: 'second' } });
      expect(signalSubscription.data()).toEqual({ value: 'second' });
    }));

    it('should not report active when the link completes synchronously', fakeAsync(() => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [provideApollo(withApolloOptions(() => ({
          cache: new InMemoryCache(),
          link: new ApolloLink(() => new ApolloObservable<any>(observer => {
            observer.complete();
          }))
        })))]
      });

      const signalSubscription = TestBed.inject(Apollo).signal.subscription({
        subscription,
        injector: TestBed.inject(Injector)
      });

      tick(0);

      expect(signalSubscription.active()).toBe(false);
      expect(signalSubscription.loading()).toBe(false);
    }));

    it('should stay enabled when the server completes the stream', fakeAsync(() => {
      const link = TestBed.inject(MockSubscriptionLink);
      const signalSubscription = apollo.signal.subscription<{ newValue: string }>({ subscription, injector });

      tick(0);
      expect(signalSubscription.active()).toBe(true);

      link.simulateComplete();
      tick(0);

      expect(signalSubscription.active()).toBe(false);
      expect(signalSubscription.enabled()).toBe(true);
      expect(signalSubscription.loading()).toBe(false);
    }));
  });

  describe('termination', () => {
    const document: TypedDocumentNode<{ value: string }> = gql`subscription { value }`;

    it('should clear initial loading when variables become null before the first effect and resume later', fakeAsync(() => {
      const subscribe = vi.spyOn(apollo, 'subscribe');
      const variables = signal<{ id: string } | null>({ id: '1' });
      const keyed: TypedDocumentNode<{ value: string }, { id: string }> = gql`subscription Value($id: ID!) { value(id: $id) }`;
      const subscription = apollo.signal.subscription({ subscription: keyed, variables, injector });

      expect(subscription.loading()).toBe(true);
      variables.set(null);
      tick();

      expect(subscription.loading()).toBe(false);
      expect(subscription.enabled()).toBe(true);
      expect(subscription.active()).toBe(false);
      expect(subscribe).not.toHaveBeenCalled();

      variables.set({ id: '2' });
      tick();
      mockSubscriptionLink.simulateResult({ result: { data: { value: 'resumed' } } });
      tick();

      expect(subscription.data()).toEqual({ value: 'resumed' });
      expect(subscribe).toHaveBeenCalledOnce();
    }));

    it('should not restart a manual execution whose stream already completed', fakeAsync(() => {
      const document: TypedDocumentNode<{ value: string }> = gql`subscription { value }`;
      const subscribe = vi.spyOn(apollo, 'subscribe').mockReturnValue(new Observable(subscriber => {
        subscriber.next({ data: { value: 'only' } });
        subscriber.complete();
      }));

      const received = vi.fn();
      const completed = vi.fn();

      const signalSubscription = apollo.signal.subscription({
        subscription: document,
        injector,
        lazy: true,
        onData: received,
        onComplete: completed
      });

      signalSubscription.execute();
      tick();

      expect(subscribe).toHaveBeenCalledOnce();
      expect(received).toHaveBeenCalledExactlyOnceWith({ value: 'only' });
      expect(completed).toHaveBeenCalledOnce();
      expect(signalSubscription.enabled()).toBe(true);
      expect(signalSubscription.active()).toBe(false);
    }));

    it('should clear a loading state that was read before terminating', fakeAsync(() => {
      const signalSubscription = apollo.signal.subscription({ subscription: document, injector });

      expect(signalSubscription.loading()).toBe(true);

      signalSubscription.terminate();
      tick();

      expect(signalSubscription.loading()).toBe(false);
      expect(signalSubscription.active()).toBe(false);
    }));
  });

  describe('terminating during a synchronous emission', () => {
    const subscription = gql`subscription { newValue }`;
    const document: TypedDocumentNode<{ value: string }> = gql`subscription { value }`;

    it('should tear the subscription down rather than install it', fakeAsync(() => {
      let observer: { next: (value: unknown) => void } | undefined;
      const teardown = vi.fn();

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [provideApollo(withApolloOptions(() => ({
          cache: new InMemoryCache(),
          link: new ApolloLink(() => new ApolloObservable<any>(subscriber => {
            observer = subscriber;
            subscriber.next({ data: { newValue: 'first' } });
            return teardown;
          }))
        })))]
      });

      const received: Array<string> = [];
      const signalSubscription = TestBed.inject(Apollo).signal.subscription<{ newValue: string }>({
        subscription,
        injector: TestBed.inject(Injector),
        onData: data => {
          received.push(data.newValue);
          signalSubscription.terminate();
        }
      });

      tick(0);

      expect(received).toEqual(['first']);
      expect(signalSubscription.active()).toBe(false);
      expect(teardown).toHaveBeenCalledOnce();

      observer?.next({ data: { newValue: 'second' } });
      tick(0);

      expect(received).toEqual(['first']);
    }));

    it('should ignore synchronous emissions and completion after a callback terminates', fakeAsync(() => {
      vi.spyOn(apollo, 'subscribe').mockReturnValue(new Observable(subscriber => {
        subscriber.next({ data: { value: 'first' } });
        subscriber.next({ data: { value: 'second' } });
        subscriber.complete();
      }));

      const seen = vi.fn();
      const completed = vi.fn();
      const signalSubscription = apollo.signal.subscription({
        subscription: document,
        injector,
        lazy: true,
        onData: data => {
          seen(data);
          signalSubscription.terminate();
        },
        onComplete: completed
      });

      signalSubscription.execute();
      tick();

      expect(seen).toHaveBeenCalledExactlyOnceWith({ value: 'first' });
      expect(completed).not.toHaveBeenCalled();
      expect(signalSubscription.active()).toBe(false);
      expect(signalSubscription.loading()).toBe(false);
    }));

    it('should preserve an execution started during teardown', fakeAsync(() => {
      const secondStream = new Subject<{ data: { value: string } }>();
      vi.spyOn(apollo, 'subscribe')
        .mockReturnValueOnce(new Observable(() => () => signalSubscription.execute()))
        .mockReturnValue(secondStream);
      const signalSubscription = apollo.signal.subscription({ subscription: document, injector, lazy: true });

      signalSubscription.execute();
      tick();
      signalSubscription.terminate();

      expect(signalSubscription.enabled()).toBe(true);
      expect(signalSubscription.active()).toBe(true);
      expect(signalSubscription.loading()).toBe(true);

      secondStream.next({ data: { value: 'second' } });
      expect(signalSubscription.data()).toEqual({ value: 'second' });
    }));

    it('should preserve an execution started synchronously inside a callback', fakeAsync(() => {
      const secondStream = new Subject<{ data: { value: string } }>();
      const subscribe = vi.spyOn(apollo, 'subscribe')
        .mockReturnValueOnce(new Observable(subscriber => subscriber.next({ data: { value: 'first' } })))
        .mockReturnValue(secondStream);

      const signalSubscription = apollo.signal.subscription({
        subscription: document,
        injector,
        lazy: true,
        onData: data => {
          if (data.value === 'first') signalSubscription.execute();
        }
      });

      signalSubscription.execute();
      tick();

      expect(signalSubscription.active()).toBe(true);
      expect(signalSubscription.loading()).toBe(true);
      expect(subscribe).toHaveBeenCalledTimes(2);

      secondStream.next({ data: { value: 'second' } });
      expect(signalSubscription.data()).toEqual({ value: 'second' });
      expect(signalSubscription.loading()).toBe(false);
    }));
  });

  describe('required inputs', () => {
    const keyedSubscription = gql`subscription S($id: ID!) { newValue(id: $id) }`;

    @Component({ template: '', standalone: true })
    class Host {
      public readonly id = input.required<string>();
      public readonly subscription = inject(Apollo).signal.subscription({ subscription: keyedSubscription, variables: () => ({ id: this.id() }) });
    }

    it('should not read variables before the component receives its inputs', () => {
      const fixture = TestBed.createComponent(Host);

      fixture.componentRef.setInput('id', '1');

      expect(fixture.componentInstance.subscription.variables()).toEqual({ id: '1' });
    });

    it('should destroy cleanly when the inputs were never set', () => {
      const fixture = TestBed.createComponent(Host);

      expect(() => fixture.destroy()).not.toThrow();
    });
  });
});
