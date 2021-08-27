import { ApolloCache, DataProxy, OperationVariables as Variables } from '@apollo/client/core';

export interface ModifyQueryOptions<T, V> extends Omit<DataProxy.WriteQueryOptions<T, V>, 'data'> { }
export interface ModifyFragmentOptions<T, V> extends Omit<DataProxy.WriteFragmentOptions<T, V>, 'data'> { }

export function modifyQuery<T = any, V = Variables>(
  cache: ApolloCache<any>,
  options: ModifyQueryOptions<T, V>,
  modifyFn: (data: T | null) => T | null | void
): T | null {
  const value = cache.readQuery<T, V>(options);
  const data = modifyFn(value);
  if (typeof data === 'undefined') return value;
  cache.writeQuery({ ...options, data });
  return data;
}

export function modifyFragment<T = any, V = Variables>(
  cache: ApolloCache<any>,
  options: ModifyFragmentOptions<T, V>,
  modifyFn: (data: T | null) => T | null | void
): T | null {
  const value = cache.readFragment<T>(options);
  const data = modifyFn(value);
  if (typeof data === 'undefined') return value;
  cache.writeFragment<T | null>({ ...options, data });
  return data;
}
