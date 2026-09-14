import { TestBed, waitForAsync } from '@angular/core/testing';
import { Apollo, CacheQueryObservable, IncompleteCacheError } from '@apollo-orbit/angular';
import { gql, OperationVariables } from '@apollo/client';
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

  describe('returnPartialData = false (default)', () => {
    it('should produce value if cache has complete data', () => {
      const resultFn = vi.fn();
      const errorFn = vi.fn();
      apollo.cache.writeQuery({ query: gql`query { a, b }`, data: { a: '1', b: '2' } });

      apollo.cache.watchQuery<Value>({ query: gql`query { a b }` }).subscribe({
        next: resultFn,
        error: errorFn
      });

      expect(resultFn).toHaveBeenCalledWith({ data: { a: '1', b: '2' }, complete: true, missing: undefined });
      expect(errorFn).not.toHaveBeenCalled();
    });

    it('should report null data rather than failing when the cache is missing a field', () => {
      const resultFn = vi.fn();
      const errorFn = vi.fn();
      apollo.cache.writeQuery({ query: gql`query { a }`, data: { a: '1' } });

      apollo.cache.watchQuery<Value>({ query: gql`query { a b }` }).subscribe({
        next: resultFn,
        error: errorFn
      });

      expect(resultFn).toHaveBeenCalledWith(expect.objectContaining({ complete: false, data: null }));
      expect(errorFn).not.toHaveBeenCalled();
    });
  });

  describe('result shape', () => {
    it('should not pass cache internals through in the result', () => {
      const resultFn = vi.fn();
      const query = gql`query { a b }`;
      apollo.cache.writeQuery({ query, data: { a: '1', b: '2' } });

      apollo.cache.watchQuery<Value>({ query }).subscribe(resultFn);

      // A named optimistic transaction is what a mutation with an `optimisticResponse` records, and the
      // diff it broadcasts carries `fromOptimisticTransaction`.
      apollo.cache.recordOptimisticTransaction(
        cache => cache.writeQuery({ query, data: { a: '3', b: '4' } }),
        'optimistic-id'
      );

      expect(resultFn).toHaveBeenCalledTimes(2);
      expect(Object.keys(resultFn.mock.lastCall![0] as object).sort()).toEqual(['complete', 'data', 'missing']);
    });
  });

  describe('required', () => {
    it('should enforce required mode when constructed directly', () => {
      const options = { query: gql`query { a b }` };
      const optional = new CacheQueryObservable(apollo.cache, options);
      const required = new CacheQueryObservable(apollo.cache, options, true);
      const onError = vi.fn();

      expect(optional.getCurrentResult()).toMatchObject({ complete: false, data: null });
      expect(() => required.getCurrentResult()).toThrow(IncompleteCacheError);
      required.subscribe({ error: onError });
      expect(onError).toHaveBeenCalledWith(expect.any(IncompleteCacheError));

      apollo.cache.writeQuery({ query: options.query, data: { a: '1', b: '2' } });
      expect(required.getCurrentResult()).toMatchObject({ complete: true, data: { a: '1', b: '2' } });
    });

    it('should reach fully typed data without narrowing', () => {
      const resultFn = vi.fn();
      const errorFn = vi.fn();
      apollo.cache.writeQuery({ query: gql`query { a b }`, data: { a: '1', b: '2' } });

      apollo.cache.watchQuery.required<Value>({ query: gql`query { a b }` }).subscribe({
        next: result => resultFn(result.data.a),
        error: errorFn
      });

      expect(resultFn).toHaveBeenCalledWith('1');
      expect(errorFn).not.toHaveBeenCalled();
    });

    it('should error rather than emit null data when the assertion does not hold', () => {
      const resultFn = vi.fn();
      const errorFn = vi.fn();
      apollo.cache.writeQuery({ query: gql`query { a }`, data: { a: '1' } });

      apollo.cache.watchQuery.required<Value>({ query: gql`query { a b }` }).subscribe({
        next: resultFn,
        error: errorFn
      });

      expect(resultFn).not.toHaveBeenCalled();
      expect(errorFn).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('A required cache query read an incomplete result') as string
      }));
    });

    it('should throw from getCurrentResult when the assertion does not hold', () => {
      const observable = apollo.cache.watchQuery.required<Value>({ query: gql`query { a b }` });

      expect(() => observable.getCurrentResult()).toThrow(/required cache query read an incomplete result/);
    });

    it('should report later incomplete results as errors and stop watching', () => {
      const query = gql`query { a b }`;
      apollo.cache.writeQuery({ query, data: { a: '1', b: '2' } });

      const watch = apollo.cache.watch.bind(apollo.cache);
      const teardown = vi.fn();
      vi.spyOn(apollo.cache, 'watch').mockImplementation(options => {
        const stop = watch(options);
        return () => {
          stop();
          teardown();
        };
      });
      const next = vi.fn();
      const error = vi.fn();
      const subscription = apollo.cache.watchQuery.required<Value>({ query }).subscribe({ next, error });

      expect(next).toHaveBeenCalledOnce();
      expect(() => apollo.cache.evict({ fieldName: 'b' })).not.toThrow();

      expect(error).toHaveBeenCalledExactlyOnceWith(expect.any(IncompleteCacheError));
      expect(subscription.closed).toBe(true);
      expect(teardown).toHaveBeenCalledOnce();

      apollo.cache.writeQuery({ query, data: { a: '3', b: '4' } });
      expect(next).toHaveBeenCalledOnce();
    });
  });

  describe('returnPartialData = true', () => {
    it('should produce value if cache has complete data', () => {
      const resultFn = vi.fn();
      const errorFn = vi.fn();
      apollo.cache.writeQuery({ query: gql`query { a, b }`, data: { a: '1', b: '2' } });

      apollo.cache.watchQuery<Value, OperationVariables, true>({ query: gql`query { a b }`, returnPartialData: true }).subscribe({
        next: resultFn,
        error: errorFn
      });

      expect(resultFn).toHaveBeenCalledWith({ data: { a: '1', b: '2' }, complete: true, missing: undefined });
      expect(errorFn).not.toHaveBeenCalled();
    });

    it('should keep the fields the cache did have', () => {
      const resultFn = vi.fn();
      const errorFn = vi.fn();
      apollo.cache.writeQuery({ query: gql`query { a }`, data: { a: '1' } });

      apollo.cache.watchQuery<Value, OperationVariables, true>({ query: gql`query { a b }`, returnPartialData: true }).subscribe({
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

  it('should update missing field diagnostics when incomplete data stays null', () => {
    const watch = apollo.cache.watchQuery({ query: gql`query { a b }` });
    const first = watch.getCurrentResult();

    apollo.cache.writeQuery({ query: gql`query { a }`, data: { a: 'present' } });

    const second = watch.getCurrentResult();

    expect(first.data).toBeNull();
    expect(second.data).toBeNull();
    expect(second.missing?.message).toContain('\'b\'');
    expect(second.missing).not.toBe(first.missing);
  });
});
