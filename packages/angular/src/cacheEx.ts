import type { ApolloCache, DocumentNode, MissingFieldError, TypedDocumentNode, OperationVariables as Variables } from '@apollo/client';
import type { DeepPartial } from '@apollo/client/utilities';
import { Observable } from 'rxjs';

export interface CacheWatchQueryOptions<TData, TVariables> {
  query: DocumentNode | TypedDocumentNode<TData, TVariables>;
  variables?: TVariables;
  optimistic?: boolean;
  immediate?: boolean;
  /**
   * If set to true, the observable will emit the partial data that is available in the cache.
   * If set to false, the observable will throw an error if the complete data is not available in the cache.
   * @default false
   */
  returnPartialData?: boolean;
}

export interface CacheWatchQueryCompleteResult<TData> {
  data: TData;
  complete: true;
  missing?: never;
}

export interface CacheWatchQueryPartialResult<TData> {
  data: DeepPartial<TData> | undefined;
  complete: false;
  missing?: Array<MissingFieldError>;
}

export type CacheWatchQueryResult<TData> =
  | CacheWatchQueryCompleteResult<TData>
  | CacheWatchQueryPartialResult<TData>;

export interface ApolloCacheEx extends ApolloCache {
  /**
   * Watches the cache store for the query document provided.
   */
  watchQuery<TData = unknown, TVariables extends Variables = Variables>(options: CacheWatchQueryOptions<TData, TVariables> & { returnPartialData: true }): Observable<CacheWatchQueryPartialResult<TData>>;
  watchQuery<TData = unknown, TVariables extends Variables = Variables>(options: CacheWatchQueryOptions<TData, TVariables>): Observable<CacheWatchQueryCompleteResult<TData>>;
}

export function extendCache(cache: ApolloCache): ApolloCacheEx {
  return Object.defineProperties(cache, {
    watchQuery: {
      value: watchQuery,
      writable: false,
      configurable: false
    }
  }) as ApolloCacheEx;
}

function watchQuery<TData, TVariables extends Variables = Variables>(
  this: ApolloCache,
  options: CacheWatchQueryOptions<TData, TVariables>
): Observable<CacheWatchQueryResult<TData>> {
  const { immediate = true, optimistic = true } = options;
  return new Observable<CacheWatchQueryResult<TData>>(
    subscriber => {
      try {
        return this.watch<TData, TVariables>({
          ...options,
          optimistic,
          immediate,
          callback: ({ result, ...rest }) => {
            subscriber.next({ ...rest, data: result } as CacheWatchQueryResult<TData>);
          }
        });
      } catch (error) {
        subscriber.error(error);
        return void 0;
      }
    });
}
