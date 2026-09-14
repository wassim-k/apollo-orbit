import { TestBed } from '@angular/core/testing';
import { Apollo } from '@apollo-orbit/angular';
import { gql, TypedDocumentNode } from '@apollo/client';
import { provideApolloMock } from '../helpers/apollo-mock.provider';

interface Value {
  value: string;
}

describe('ApolloSignal', () => {
  let apollo: Apollo;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideApolloMock()]
    });

    apollo = TestBed.inject(Apollo);
  });

  describe('Injection Context', () => {
    it('should throw when query is called without injector outside injection context', () => {
      const query: TypedDocumentNode<Value> = gql`query { value }`;

      expect(() => {
        apollo.signal.query({ query });
      }).toThrow(/NG0203/);
    });

    it('should throw when query.once is called without injector outside injection context', () => {
      const query: TypedDocumentNode<Value> = gql`query { value }`;

      expect(() => {
        apollo.signal.query.once({ query });
      }).toThrow(/NG0203/);
    });

    it('mutation does not require injection context', () => {
      const mutation = gql`mutation { update }`;

      expect(() => {
        apollo.signal.mutation(mutation);
      }).not.toThrow();
    });

    it('should throw when subscription is called without injector outside injection context', () => {
      const subscription = gql`subscription { value }`;

      expect(() => {
        apollo.signal.subscription({ subscription });
      }).toThrow(/NG0203/);
    });

    it('should throw when fragment is called without injector outside injection context', () => {
      const fragment = gql`fragment BookFragment on Book { id }`;

      expect(() => {
        apollo.signal.fragment({ fragment, from: { id: '1' } });
      }).toThrow(/NG0203/);
    });

    it('should throw when cacheQuery is called without injector outside injection context', () => {
      const query = gql`query { value }`;

      expect(() => {
        apollo.signal.cacheQuery({ query });
      }).toThrow(/NG0203/);
    });
  });
});
