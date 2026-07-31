import { DataState, NetworkStatus } from '@apollo/client';
import type { QueryResult } from '../types';

export function emptyQueryResult<TData, TStates extends DataState<TData>['dataState']>(): QueryResult<TData, TStates> {
  return {
    data: undefined,
    dataState: 'empty',
    loading: false,
    networkStatus: NetworkStatus.ready
  } as QueryResult<TData, TStates>;
}

export function withPreviousData<TData, TStates extends DataState<TData>['dataState']>(
  previous: QueryResult<TData, TStates> | undefined,
  result: QueryResult<TData, TStates>
): QueryResult<TData, TStates> {
  return {
    ...result,
    previousData: previous?.data ?? previous?.previousData
  } as QueryResult<TData, TStates>;
}
