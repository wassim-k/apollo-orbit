import type { Cache, DataValue, DocumentNode, MissingFieldError, TypedDocumentNode, OperationVariables as Variables } from '@apollo/client';
import type { Unmasked } from '@apollo/client/masking';
import { CacheQueryObservable } from './cacheQueryObservable';

export interface CacheQueryOptions<TData, TVariables, TPartial extends boolean = boolean> {
  /**
   * A GraphQL query document parsed into an AST by gql.
   */
  query: DocumentNode | TypedDocumentNode<TData, TVariables>;

  /**
   * An object containing all of the variables your query needs to execute.
   */
  variables?: TVariables;

  /**
   * If `true`, the query is evaluated against the optimistic cache layer as well as the normal one, so
   * optimistic updates show up immediately.
   * @default true
   */
  optimistic?: boolean;

  /**
   * If `false`, the observable waits for the next cache change rather than emitting what the cache
   * already holds when it is subscribed to.
   * @default true
   */
  immediate?: boolean;

  /**
   * If `true`, an incomplete read carries the partial data the cache holds rather than `data: null`,
   * and widens `data` to match. `complete` is `false` either way.
   * @default false
   */
  returnPartialData?: TPartial;
}

export interface CacheQueryCompleteResult<TData> {
  data: DataValue.Complete<Unmasked<TData>>;
  complete: true;
  missing?: never;
}

export interface CacheQueryIncompleteResult<TData, TPartial extends boolean = false> {
  data: TPartial extends true ? DataValue.Partial<Unmasked<TData>> | null : null;
  complete: false;
  missing?: MissingFieldError;
}

export type CacheQueryResult<TData, TPartial extends boolean = false, TRequired extends boolean = false> =
  TRequired extends true
  ? CacheQueryCompleteResult<TData>
  : CacheQueryCompleteResult<TData> | CacheQueryIncompleteResult<TData, TPartial>;

export type CacheQueryData<TData, TPartial extends boolean = false, TRequired extends boolean = false> =
  CacheQueryResult<TData, TPartial, TRequired>['data'];

export interface CacheQueryFn {
  /**
   * Watches the cache store for the query document provided.
   * Narrow each result on `complete` to reach fully typed `data`.
   *
   * Use `watchQuery.required` for a query whose data is always available in the cache.
   */
  <TData = unknown, TVariables extends Variables = Variables, TPartial extends boolean = false>(
    options: CacheQueryOptions<TData, TVariables, TPartial>
  ): CacheQueryObservable<TData, TVariables, TPartial>;

  /**
   * Watches a query whose data is always available in the cache. Each result carries fully typed
   * `data`.
   *
   * An incomplete read reaches the observable's error channel, rather than emitting `null` behind a
   * `TData`.
   */
  required<TData = unknown, TVariables extends Variables = Variables>(
    options: Omit<CacheQueryOptions<TData, TVariables, false>, 'returnPartialData'>
  ): CacheQueryObservable<TData, TVariables, false, true>;
}

export type ApolloCacheEx = Cache.Implementation & {
  watchQuery: CacheQueryFn;
};

export function extendCache(cache: Cache.Implementation): ApolloCacheEx {
  return Object.defineProperties(cache, {
    watchQuery: {
      value: Object.assign(
        (options: CacheQueryOptions<any, any, any>): CacheQueryObservable<any, any, any, any> =>
          new CacheQueryObservable(cache, options),
        {
          required: (options: CacheQueryOptions<any, any, any>): CacheQueryObservable<any, any, any, any> =>
            new CacheQueryObservable(cache, options, true)
        }
      ) satisfies CacheQueryFn,
      writable: false,
      configurable: true // A shared cache instance between clients overwrite this property
    }
  }) as ApolloCacheEx;
}
