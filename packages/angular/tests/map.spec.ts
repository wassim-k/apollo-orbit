import { mapMutation, mapQuery, mapSubscription, MutationResult, NetworkStatus, QueryResult, SubscriptionResult } from '@apollo-orbit/angular';
import { of } from 'rxjs';

interface Data {
  parent: { child: { value: string } };
}

describe('Map', () => {
  it('should map query', () => {
    of<QueryResult<Data, 'empty' | 'complete'>>({
      loading: false,
      data: { parent: { child: { value: 'new' } } },
      previousData: { parent: { child: { value: 'old' } } },
      dataState: 'complete',
      networkStatus: NetworkStatus.ready
    }).pipe(
      mapQuery(data => data.parent.child.value)
    ).subscribe(result => {
      expect(result.data).toBe('new');
      expect(result.networkStatus).toBe(NetworkStatus.ready);
      expect(result.previousData).toBe('old');
    });
  });

  it('should map mutation', () => {
    of({
      data: { parent: { child: { value: 'mutated' } } },
      error: undefined
    }).pipe(
      mapMutation(data => data.parent.child.value)
    ).subscribe(result => {
      expect(result.data).toBe('mutated');
    });
  });

  it('should map subscription', () => {
    of({
      data: { parent: { child: { value: 'subscribed' } } },
      error: undefined
    }).pipe(
      mapSubscription(data => data.parent.child.value)
    ).subscribe(result => {
      expect(result.data).toBe('subscribed');
    });
  });

  it('should map query without data', () => {
    of<QueryResult<Data, 'empty' | 'complete'>>({
      loading: true,
      data: undefined,
      dataState: 'empty',
      networkStatus: NetworkStatus.loading
    }).pipe(
      mapQuery(data => data.parent.child.value)
    ).subscribe(result => {
      expect(result.data).toBeUndefined();
      expect(result.previousData).toBeUndefined();
      expect(result.networkStatus).toBe(NetworkStatus.loading);
    });
  });

  it('should map mutation without data', () => {
    of<MutationResult<Data>>({
      data: undefined,
      error: new Error('Mutation error')
    }).pipe(
      mapMutation(data => data.parent.child.value)
    ).subscribe(result => {
      expect(result.data).toBeUndefined();
      expect(result.error?.message).toBe('Mutation error');
    });
  });

  it('should map subscription without data', () => {
    of<SubscriptionResult<Data>>({
      data: undefined,
      error: new Error('Subscription error')
    }).pipe(
      mapSubscription(data => data.parent.child.value)
    ).subscribe(result => {
      expect(result.data).toBeUndefined();
      expect(result.error?.message).toBe('Subscription error');
    });
  });
});
