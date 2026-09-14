import { fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { Apollo, QueryResult, SingleQueryResult, startWithLoading } from '@apollo-orbit/angular';
import { ErrorLike, gql, NetworkStatus, TypedDocumentNode } from '@apollo/client';
import { MockLink, MockSubscriptionLink } from '@apollo/client/testing';
import { GraphQLError } from 'graphql';
import { firstValueFrom } from 'rxjs';
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
    it('should query', waitForAsync(() => {
      const query: TypedDocumentNode<Value> = gql`query { value }`;
      mockLink.addMockedResponse({
        request: { query },
        result: { data: { value: 'expected' } }
      });

      apollo.query({ query }).subscribe(result => {
        expect(result.data.value).toEqual('expected');
      });
    }));

    it('should emit only the final result', waitForAsync(() => {
      const query: TypedDocumentNode<Value> = gql`query { value }`;
      const results: Array<SingleQueryResult<Value>> = [];

      mockLink.addMockedResponse({
        request: { query },
        result: { data: { value: 'expected' } }
      });

      // `client.query` resolves once, and Apollo Client rejects `notifyOnNetworkStatusChange` for it, so there is
      // no loading state to report.
      apollo.query({ query }).subscribe({
        next: result => results.push(result),
        complete: () => {
          expect(results).toMatchObject([{ data: { value: 'expected' } }]);
        }
      });
    }));

    it('should emit a loading result first with startWithLoading', waitForAsync(() => {
      const query: TypedDocumentNode<Value> = gql`query { value }`;
      const results: Array<QueryResult<Value, 'empty' | 'complete'>> = [];

      mockLink.addMockedResponse({
        request: { query },
        result: { data: { value: 'expected' } }
      });

      apollo.query({ query }).pipe(startWithLoading()).subscribe({
        next: result => results.push(result),
        complete: () => {
          expect(results).toMatchObject([
            { loading: true, data: undefined, networkStatus: NetworkStatus.loading },
            { loading: false, data: { value: 'expected' } }
          ]);
        }
      });
    }));

    it('should throw graphql errors (errorPolicy: none)', waitForAsync(() => {
      const query: TypedDocumentNode<Value> = gql`query { value }`;
      mockLink.addMockedResponse({
        request: { query },
        result: { errors: [new GraphQLError('Invalid query')] }
      });

      apollo.query({ query, errorPolicy: 'none' }).subscribe({
        error: (error: Error) => {
          expect(error.message).toEqual('Invalid query');
        }
      });
    }));

    it('should emit graphql errors (errorPolicy: all)', waitForAsync(() => {
      const query: TypedDocumentNode<Value> = gql`query { value }`;
      mockLink.addMockedResponse({
        request: { query },
        result: { errors: [new GraphQLError('Invalid query')] }
      });

      apollo.query({ query, errorPolicy: 'all' }).subscribe({
        next: result => {
          expect(result.error?.message).toEqual('Invalid query');
        }
      });
    }));

    it('should emit network error', waitForAsync(() => {
      const query: TypedDocumentNode<Value> = gql`query { value }`;
      mockLink.addMockedResponse({
        request: { query },
        error: new Error('An unexpected error has occurred')
      });

      apollo.query({ query }).subscribe({
        error: error => {
          expect(error.message).toEqual('An unexpected error has occurred');
        }
      });
    }));

    it('should emit the error as a result (errorPolicy: all)', waitForAsync(() => {
      const query = gql`query { value }`;
      mockLink.addMockedResponse({
        request: { query },
        error: new Error('Network error')
      });

      apollo.query({ query, errorPolicy: 'all' }).subscribe(result => {
        expect(result.error?.message).toBe('Network error');
      });
    }));
  });

  describe('subscribe', () => {
    it('should subscribe', fakeAsync(() => {
      const mockFn = vi.fn();
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
    it('should mutate', waitForAsync(() => {
      const mutation: TypedDocumentNode<{ update: string }> = gql`mutation Update { update }`;
      mockLink.addMockedResponse({
        request: { query: mutation },
        result: { data: { update: 'expected' } }
      });

      apollo.mutate({ mutation }).subscribe(result => {
        expect(result.data.update).toEqual('expected');
      });
    }));

    it('should emit graphql errors (errorPolicy: none)', waitForAsync(() => {
      const mutation: TypedDocumentNode<{ update: string }> = gql`mutation Update { update }`;
      mockLink.addMockedResponse({
        request: { query: mutation },
        result: { errors: [new GraphQLError('Invalid query')] }
      });

      apollo.mutate({ mutation, errorPolicy: 'none' }).subscribe({
        error: (error: ErrorLike) => {
          expect(error.message).toEqual('Invalid query');
        }
      });
    }));

    it('should emit graphql errors (errorPolicy: all)', waitForAsync(() => {
      const mutation: TypedDocumentNode<{ update: string }> = gql`mutation Update { update }`;
      mockLink.addMockedResponse({
        request: { query: mutation },
        result: { errors: [new GraphQLError('Invalid query')] }
      });

      apollo.mutate({ mutation, errorPolicy: 'all' }).subscribe({
        next: result => {
          expect(result.error?.message).toEqual('Invalid query');
        }
      });
    }));

    it('should emit graphql errors (errorPolicy: ignore)', waitForAsync(() => {
      const mutation: TypedDocumentNode<{ update: string }> = gql`mutation Update { update }`;
      mockLink.addMockedResponse({
        request: { query: mutation },
        result: { data: { update: 'value' }, errors: [new GraphQLError('Invalid query')] }
      });

      apollo.mutate({ mutation, errorPolicy: 'ignore' }).subscribe({
        next: result => {
          expect(result.error).toBeUndefined();
          expect(result.data).toEqual({ update: 'value' });
        }
      });
    }));

    it('should emit network error regardless of errorPolicy', waitForAsync(() => {
      const mutation: TypedDocumentNode<{ update: string }> = gql`mutation Update { update }`;
      mockLink.addMockedResponse({
        request: { query: mutation },
        error: new Error('An unexpected error has occurred')
      });

      apollo.mutate({ mutation, errorPolicy: 'all' }).subscribe(result => {
        expect(result.error?.message).toEqual('An unexpected error has occurred');
      });
    }));
  });

  it('should resolve a cache-only miss without data', async () => {
    const document: TypedDocumentNode<{ value: string }> = gql`query { value }`;

    expect((await firstValueFrom(apollo.query({ query: document, fetchPolicy: 'cache-only' }))).data).toBeUndefined();
  });
});
