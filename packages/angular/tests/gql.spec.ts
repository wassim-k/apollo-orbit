import { identifyFragment } from '@apollo-orbit/angular';
import { gql } from '@apollo/client';

describe('GQL', () => {
  describe('identifyFragment', () => {
    it('should return fragment type and name', () => {
      const { id, fragmentName } = identifyFragment(gql`fragment Fragment on Type { value }`, '1');
      expect(id).toBe('Type:1');
      expect(fragmentName).toBe('Fragment');
    });

    it('should return fragment type and name from multiple fragment document', () => {
      const fragmentDoc = gql`
        fragment MainFragment on Type {
          nested {
            ...NestedFragment
          }
        }

        fragment NestedFragment on Type2 {
          value
        }
      `;
      const { id, fragmentName } = identifyFragment(fragmentDoc, '2', 'NestedFragment');
      expect(id).toBe('Type2:2');
      expect(fragmentName).toBe('NestedFragment');
    });
  });
});
