import { mapQuery, NetworkStatus, QueryResult } from '@apollo-orbit/angular';
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
      expect(result.data).toBe('query');
      expect(result.networkStatus).toBe(NetworkStatus.ready);
      expect(result.previousData).toBe('query');
    });
  });
});
