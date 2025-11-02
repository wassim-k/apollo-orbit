import { TestBed, waitForAsync } from '@angular/core/testing';
import { Apollo } from '@apollo-orbit/angular';
import { gql } from '@apollo/client';
import { asyncScheduler, observeOn } from 'rxjs';
import { provideApolloMock } from './helpers';

interface Value {
  a: string;
  b: string;
}

describe('CacheEx', () => {
  let apollo: Apollo;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideApolloMock()]
    });

    apollo = TestBed.inject(Apollo);
  });

  describe('cyclic update', () => {
    it('should throw an error when cyclic update is detected', waitForAsync(() => {
      const errorFn = vi.fn();
      apollo.cache.writeQuery<Value>({ query: gql`query { a b }`, data: { a: '1', b: '2' } });

      apollo.cache.watchQuery({ query: gql`query { a b }` }).subscribe(() => {
        try {
          apollo.cache.writeQuery({ query: gql`query { c }`, data: { c: '3' } });
        } catch (error: any) {
          errorFn(error);
        }

        expect(errorFn).toHaveBeenCalledWith(expect.objectContaining({ message: 'already recomputing' }));
      });
    }));

    it('should not throw an error when cyclic update is deferred', waitForAsync(() => {
      const errorFn = vi.fn();
      apollo.cache.writeQuery<Value>({ query: gql`query { a b }`, data: { a: '1', b: '2' } });

      apollo.cache.watchQuery({ query: gql`query { a b }` })
        .pipe(observeOn(asyncScheduler))
        .subscribe(() => {
          try {
            apollo.cache.writeQuery({ query: gql`query { c }`, data: { c: '3' } });
          } catch (error: any) {
            errorFn(error);
          }

          expect(errorFn).not.toHaveBeenCalled();
        });
    }));
  });

  describe('returnPartial = false', () => {
    it('should produce value if cache has complete data', () => {
      const resultFn = vi.fn();
      const errorFn = vi.fn();
      apollo.cache.writeQuery({ query: gql`query { a, b }`, data: { a: '1', b: '2' } });

      apollo.cache.watchQuery<Value>({ query: gql`query { a b }`, returnPartialData: false }).subscribe({
        next: resultFn,
        error: errorFn
      });

      expect(resultFn).toHaveBeenCalledWith({ data: { a: '1', b: '2' }, complete: true, missing: undefined });
      expect(errorFn).not.toHaveBeenCalled();
    });

    it('should throw error if cache has partial data', () => {
      const resultFn = vi.fn();
      const errorFn = vi.fn();
      apollo.cache.writeQuery({ query: gql`query { a }`, data: { a: '1' } });

      apollo.cache.watchQuery<Value>({ query: gql`query { a b }`, returnPartialData: false }).subscribe({
        next: resultFn,
        error: errorFn
      });

      expect(resultFn).toHaveBeenCalledWith(expect.objectContaining({ complete: false, data: null }));
      expect(errorFn).not.toHaveBeenCalled();
    });
  });

  describe('returnPartial = true', () => {
    it('should produce value if cache has complete data', () => {
      const resultFn = vi.fn();
      const errorFn = vi.fn();
      apollo.cache.writeQuery({ query: gql`query { a, b }`, data: { a: '1', b: '2' } });

      apollo.cache.watchQuery<Value>({ query: gql`query { a b }`, returnPartialData: true }).subscribe({
        next: resultFn,
        error: errorFn
      });

      expect(resultFn).toHaveBeenCalledWith({ data: { a: '1', b: '2' }, complete: true, missing: undefined });
      expect(errorFn).not.toHaveBeenCalled();
    });

    it('should return partial data', () => {
      const resultFn = vi.fn();
      const errorFn = vi.fn();
      apollo.cache.writeQuery({ query: gql`query { a }`, data: { a: '1' } });

      apollo.cache.watchQuery<Value>({ query: gql`query { a b }`, returnPartialData: true }).subscribe({
        next: resultFn,
        error: errorFn
      });

      expect(resultFn).toHaveBeenCalledWith(expect.objectContaining({ data: { a: '1' }, complete: false }));
      expect(errorFn).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should catch and emit errors from cache.watch', () => {
      const errorFn = vi.fn();

      vi.spyOn(apollo.cache, 'watch').mockImplementation(() => {
        throw new Error('Cache watch error');
      });

      apollo.cache.watchQuery({ query: gql`query { a b }` }).subscribe({
        error: errorFn
      });

      expect(errorFn).toHaveBeenCalledWith(expect.objectContaining({ message: 'Cache watch error' }));
    });
  });
});
