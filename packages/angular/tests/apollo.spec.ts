import { fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { Apollo } from '@apollo-orbit/angular';
import { ErrorLike, gql } from '@apollo/client';
import { MockLink, MockSubscriptionLink } from '@apollo/client/testing';
import { GraphQLError } from 'graphql';
import { provideApolloMock } from './helpers';

interface Value {
  value: string;
}

describe('Apollo', () => {
  let apollo: Apollo;
  let mockLink: MockLink;
  let mockSubscriptionLink: MockSubscriptionLink;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideApolloMock()]
    });

    apollo = TestBed.inject(Apollo);
    mockLink = TestBed.inject(MockLink);
    mockSubscriptionLink = TestBed.inject(MockSubscriptionLink);
  });

  describe('query', () => {
    it('should query', () => {
      const query = gql`query { value }`;
      mockLink.addMockedResponse({
        request: { query },
        result: { data: { value: 'expected' } }
      });

      apollo.query<Value>({ query }).subscribe(result => {
        expect(result.data?.value).toEqual('expected');
      });
    });

    it('should throw graphql errors (errorPolicy: none)', waitForAsync(() => {
      const query = gql`query { value }`;
      mockLink.addMockedResponse({
        request: { query },
        result: { errors: [new GraphQLError('Invalid query')] }
      });

      apollo.query<Value>({ query, errorPolicy: 'none' }).subscribe({
        error: (error: Error) => {
          expect(error.message).toEqual('Invalid query');
        }
      });
    }));

    it('should emit graphql errors (errorPolicy: all)', waitForAsync(() => {
      const query = gql`query { value }`;
      mockLink.addMockedResponse({
        request: { query },
        result: { errors: [new GraphQLError('Invalid query')] }
      });

      apollo.query<Value>({ query, errorPolicy: 'all' }).subscribe({
        next: result => {
          expect(result.error?.message).toEqual('Invalid query');
        }
      });
    }));

    it('should emit network error', waitForAsync(() => {
      const query = gql`query { value }`;
      mockLink.addMockedResponse({
        request: { query },
        error: new Error('An unexpected error has occurred')
      });

      apollo.query<Value>({ query }).subscribe({
        error: error => {
          expect(error.message).toEqual('An unexpected error has occurred');
        }
      });
    }));
  });

  describe('subscribe', () => {
    it('should subscribe', fakeAsync(() => {
      const mockFn = jest.fn();
      const subscription = gql`subscription { newNotification }`;

      apollo.subscribe<{ newNotification: string }>({ subscription }).subscribe(result => {
        mockFn(result.data?.newNotification);

        if (mockFn.mock.calls.length === 2) {
          expect(mockFn.mock.calls).toEqual([['expected 1'], ['expected 2']]);
        }
      });

      mockSubscriptionLink.simulateResult({ result: { data: { newNotification: 'expected 1' } } });
      tick();
      mockSubscriptionLink.simulateResult({ result: { data: { newNotification: 'expected 2' } } });
      tick();
      mockSubscriptionLink.simulateComplete();
      tick();
    }));
  });

  describe('mutate', () => {
    it('should mutate', () => {
      const mutation = gql`mutation Update { update }`;
      mockLink.addMockedResponse({
        request: { query: mutation },
        result: { data: { update: 'expected' } }
      });

      apollo.mutate<{ update: string }>({ mutation }).subscribe(result => {
        expect(result.data?.update).toEqual('expected');
      });
    });

    it('should emit graphql errors (errorPolicy: none)', waitForAsync(() => {
      const mutation = gql`mutation Update { update }`;
      mockLink.addMockedResponse({
        request: { query: mutation },
        result: { errors: [new GraphQLError('Invalid query')] }
      });

      apollo.mutate<{ update: string }>({ mutation, errorPolicy: 'none' }).subscribe({
        error: (error: ErrorLike) => {
          expect(error.message).toEqual('Invalid query');
        }
      });
    }));

    it('should emit graphql errors (errorPolicy: all)', waitForAsync(() => {
      const mutation = gql`mutation Update { update }`;
      mockLink.addMockedResponse({
        request: { query: mutation },
        result: { errors: [new GraphQLError('Invalid query')] }
      });

      apollo.mutate<{ update: string }>({ mutation, errorPolicy: 'all' }).subscribe({
        next: result => {
          expect(result.error?.message).toEqual('Invalid query');
        }
      });
    }));

    it('should emit graphql errors (errorPolicy: ignore)', waitForAsync(() => {
      const mutation = gql`mutation Update { update }`;
      mockLink.addMockedResponse({
        request: { query: mutation },
        result: { data: { update: 'value' }, errors: [new GraphQLError('Invalid query')] }
      });

      apollo.mutate<{ update: string }>({ mutation, errorPolicy: 'ignore' }).subscribe({
        next: result => {
          expect(result.error).toBeUndefined();
          expect(result.data).toEqual({ update: 'value' });
        }
      });
    }));

    it('should emit network error regardless of errorPolicy', waitForAsync(() => {
      const mutation = gql`mutation Update { update }`;
      mockLink.addMockedResponse({
        request: { query: mutation },
        error: new Error('An unexpected error has occurred')
      });

      apollo.mutate<{ update: string }>({ mutation, errorPolicy: 'all' }).subscribe({
        error: (error: ErrorLike) => {
          expect(error.message).toEqual('An unexpected error has occurred');
        }
      });
    }));
  });
});
