import { mapQuery, NetworkStatus, QueryResult } from '@apollo-orbit/angular';
import { of } from 'rxjs';

interface Data {
  parent: { child: { value: string } };
}

describe('Map', () => {
  it('should map query', () => {
    of<QueryResult<Data>>({
      loading: false,
      networkStatus: NetworkStatus.ready,
      data: { parent: { child: { value: 'new' } } },
      previousData: { parent: { child: { value: 'old' } } }
    }).pipe(
      mapQuery(data => data.parent.child.value)
    ).subscribe(result => {
      expect(result.data).toBe('query');
      expect(result.networkStatus).toBe(NetworkStatus.ready);
      expect(result.previousData).toBe('query');
    });
  });
});
