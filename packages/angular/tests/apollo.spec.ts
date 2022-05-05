import { fakeAsync, tick, waitForAsync } from '@angular/core/testing';
import { ApolloError, gql } from '@apollo/client/core';
import { MockSubscriptionLink } from '@apollo/client/testing/core';
import { GraphQLError } from 'graphql';
import { mockApollo } from './helpers';

interface Value {
  value: string;
}

describe('Apollo', () => {
  describe('query', () => {
    it('should query', () => {
      const query = gql`query { value }`;
      const apollo = mockApollo([{
        request: { query },
        result: { data: { value: 'expected' } }
      }]);

      apollo.query<Value>({ query }).subscribe(result => {
        expect(result.data?.value).toEqual('expected');
      });
    });

    it('should emit graphql errors (errorPolicy: none)', waitForAsync(() => {
      const query = gql`query { value }`;
      const apollo = mockApollo([{
        request: { query },
        result: { errors: [new GraphQLError('Invalid query')] }
      }]);

      apollo.query<Value>({ query, errorPolicy: 'none' }).subscribe({
        error: (error: Error) => {
          expect(error.message).toEqual('Invalid query');
        }
      });
    }));

    it('should emit graphql errors (errorPolicy: all)', waitForAsync(() => {
      const query = gql`query { value }`;
      const apollo = mockApollo([{
        request: { query },
        result: { errors: [new GraphQLError('Invalid query')] }
      }]);

      apollo.query<Value>({ query, errorPolicy: 'all' }).subscribe({
        next: result => {
          expect(result.error?.message).toEqual('Invalid query');
        }
      });
    }));

    it('should emit network error', waitForAsync(() => {
      const query = gql`query { value }`;
      const apollo = mockApollo([{
        request: { query },
        error: new Error('An unexpected error has occured')
      }]);

      apollo.query<Value>({ query }).subscribe({
        error: error => {
          expect(error.message).toEqual('An unexpected error has occured');
        }
      });
    }));
  });

  describe('subscribe', () => {
    it('should subscribe', fakeAsync(() => {
      const mockFn = jest.fn();
      const query = gql`subscription { newNotification }`;

      const link = new MockSubscriptionLink();
      const apollo = mockApollo(link);

      apollo.subscribe<{ newNotification: string }>({ query }).subscribe(result => {
        mockFn(result.data?.newNotification);

        if (mockFn.mock.calls.length === 2) {
          expect(mockFn.mock.calls).toEqual([['expected 1'], ['expected 2']]);
        }
      });

      link.simulateResult({ result: { data: { newNotification: 'expected 1' } } });
      tick();
      link.simulateResult({ result: { data: { newNotification: 'expected 2' } } });
      tick();
      link.simulateComplete();
      tick();
    }));
  });

  describe('mutate', () => {
    it('should mutate', () => {
      const mutation = gql`mutation Update { update }`;
      const apollo = mockApollo([{
        request: { query: mutation },
        result: { data: { update: 'expected' } }
      }]);

      apollo.mutate<{ update: string }>({ mutation }).subscribe(result => {
        expect(result.data?.update).toEqual('expected');
      });
    });

    it('should emit graphql errors (errorPolicy: none)', waitForAsync(() => {
      const mutation = gql`mutation Update { update }`;
      const apollo = mockApollo([{
        request: { query: mutation },
        result: { errors: [new GraphQLError('Invalid query')] }
      }]);

      apollo.mutate<{ update: string }>({ mutation, errorPolicy: 'none' }).subscribe({
        error: (error: ApolloError) => {
          expect(error.message).toEqual('Invalid query');
        }
      });
    }));

    it('should emit graphql errors (errorPolicy: all)', waitForAsync(() => {
      const mutation = gql`mutation Update { update }`;
      const apollo = mockApollo([{
        request: { query: mutation },
        result: { errors: [new GraphQLError('Invalid query')] }
      }]);

      apollo.mutate<{ update: string }>({ mutation, errorPolicy: 'all' }).subscribe({
        next: result => {
          expect(result.error?.message).toEqual('Invalid query');
        }
      });
    }));

    it('should emit graphql errors (errorPolicy: ignore)', waitForAsync(() => {
      const mutation = gql`mutation Update { update }`;
      const apollo = mockApollo([{
        request: { query: mutation },
        result: { data: { update: 'value' }, errors: [new GraphQLError('Invalid query')] }
      }]);

      apollo.mutate<{ update: string }>({ mutation, errorPolicy: 'ignore' }).subscribe({
        next: result => {
          expect(result.error).toBeUndefined();
          expect(result.data).toEqual({ update: 'value' });
        }
      });
    }));

    it('should emit network error regardless of errorPolicy', waitForAsync(() => {
      const mutation = gql`mutation Update { update }`;
      const apollo = mockApollo([{
        request: { query: mutation },
        error: new Error('An unexpected error has occured')
      }]);

      apollo.mutate<{ update: string }>({ mutation, errorPolicy: 'all' }).subscribe({
        error: (error: ApolloError) => {
          expect(error.message).toEqual('An unexpected error has occured');
        }
      });
    }));
  });
});
