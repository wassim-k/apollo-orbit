import { ApolloCache, MissingFieldError, OperationVariables as Variables } from '@apollo/client/core';
import { Observable } from 'rxjs';
import { PureQueryOptions } from './types';

export interface CacheWatchQueryOptions<T, V> extends PureQueryOptions<T, V> {
  optimistic?: boolean;
  immediate?: boolean;
  /**
   * If set to true, the observable will emit the partial data that is available in the cache.
   * If set to false, the observable will throw an error if the complete data is not available in the cache.
   * @default false
   */
  returnPartialData?: boolean;
}

export interface CacheWatchQueryResult<T> {
  data: T;
  complete?: boolean;
  missing?: Array<MissingFieldError>;
  fromOptimisticTransaction?: boolean;
}

export interface ApolloCacheEx<TCacheShape> extends ApolloCache<TCacheShape> {
  /**
   * Watches the cache store for the query document provided.
   */
  watchQuery<T = any, V extends Variables = Variables>(options: CacheWatchQueryOptions<T, V> & { returnPartialData?: false }): Observable<CacheWatchQueryResult<T>>;
  watchQuery<T = any, V extends Variables = Variables>(options: CacheWatchQueryOptions<T, V> & { returnPartialData: true }): Observable<CacheWatchQueryResult<T | undefined>>;
  watchQuery<T = any, V extends Variables = Variables>(options: CacheWatchQueryOptions<T, V> & { returnPartialData: boolean }): Observable<CacheWatchQueryResult<T>>;
}

export function extendCache<TCacheShape>(cache: ApolloCache<TCacheShape>): ApolloCacheEx<TCacheShape> {
  return Object.defineProperties(cache, {
    watchQuery: {
      value: watchQuery,
      writable: false,
      configurable: false
    }
  }) as ApolloCacheEx<TCacheShape>;
}

function watchQuery<T, V>(
  this: ApolloCache<any>,
  options: CacheWatchQueryOptions<T, V>
): Observable<CacheWatchQueryResult<T | undefined>> {
  const { immediate = true, optimistic = true } = options;
  return new Observable<CacheWatchQueryResult<T | undefined>>(
    subscriber => this.watch<T, V>({
      ...options,
      optimistic,
      immediate,
      callback: ({ result, ...rest }) => subscriber.next({ ...rest, data: result })
    }));
}
