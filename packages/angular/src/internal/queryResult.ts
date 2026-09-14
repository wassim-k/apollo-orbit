import { DataState, DataValue, NetworkStatus } from '@apollo/client';
import type { QueryResult, SingleQueryResult } from '../types';

export function emptyQueryResult<TData, TStates extends DataState<TData>['dataState']>(): QueryResult<TData, TStates> {
  return {
    data: undefined,
    dataState: 'empty',
    loading: false,
    networkStatus: NetworkStatus.ready
  } as QueryResult<TData, TStates>;
}

export function loadingQueryResult<TData, TStates extends DataState<TData>['dataState']>(): QueryResult<TData, TStates> {
  return {
    data: undefined,
    dataState: 'empty',
    loading: true,
    networkStatus: NetworkStatus.loading
  } as QueryResult<TData, TStates>;
}

export function toQueryResult<TData>({ data, error }: SingleQueryResult<TData>): QueryResult<TData, 'empty' | 'complete'> {
  const networkStatus = error ? NetworkStatus.error : NetworkStatus.ready;

  return data === undefined
    ? {
      data: undefined,
      error,
      dataState: 'empty',
      loading: false,
      networkStatus
    }
    : {
      data: data as DataValue.Complete<TData>,
      error,
      dataState: 'complete',
      loading: false,
      networkStatus
    };
}

export function withPreviousData<TData, TStates extends DataState<TData>['dataState']>(
  previous: QueryResult<TData, TStates> | undefined,
  result: QueryResult<TData, TStates>
): QueryResult<TData, TStates> {
  return {
    ...result,
    previousData: previous?.data ?? previous?.previousData
  };
}
