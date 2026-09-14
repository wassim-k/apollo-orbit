import { map, Observable, OperatorFunction, startWith } from 'rxjs';
import { loadingQueryResult, toQueryResult } from './internal/queryResult';
import type { QueryResult, SingleQueryResult } from './types';

/**
 * Emits a loading result before the final one, in the shape a watched query emits.
 *
 * ```ts
 * this.apollo.query({ query }).pipe(startWithLoading());
 * ```
 */
export function startWithLoading<TData>(): OperatorFunction<SingleQueryResult<TData>, QueryResult<TData, 'empty' | 'complete'>> {
  return (observable: Observable<SingleQueryResult<TData>>) => observable.pipe(
    map(toQueryResult),
    startWith(loadingQueryResult<TData, 'empty' | 'complete'>())
  );
}
