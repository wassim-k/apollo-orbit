import { DataState } from '@apollo/client';
import { OperatorFunction } from 'rxjs';
import { map } from 'rxjs/operators';
import { GetData, QueryResult, SubscriptionResult } from './types';

export type MappedMutationResult<TResult extends { data: unknown }, R> =
  Omit<TResult, 'data'> & { data: undefined extends TResult['data'] ? R | undefined : R };

export function mapQuery<T, R, TStates extends DataState<T>['dataState']>(
  mapFn: (data: GetData<T, Exclude<TStates, 'empty'>>) => R
): OperatorFunction<QueryResult<T, TStates>, QueryResult<R, TStates>> {
  return map(result => mapQueryResult(result, mapFn));
}

export function mapMutation<TResult extends { data: unknown }, R>(
  mapFn: (data: Exclude<TResult['data'], undefined>) => R
): OperatorFunction<TResult, MappedMutationResult<TResult, R>> {
  return map(result => mapMutationResult(result, mapFn));
}

export function mapSubscription<T, R>(mapFn: (data: T) => R | undefined): OperatorFunction<SubscriptionResult<T>, SubscriptionResult<R>> {
  return map(result => mapSubscriptionResult(result, mapFn));
}

export function mapQueryResult<T, R, TStates extends DataState<T>['dataState']>(
  result: QueryResult<T, TStates>,
  mapFn: (data: GetData<T, Exclude<TStates, 'empty'>>) => R
): QueryResult<R, TStates> {
  const { data, previousData, ...rest } = result;
  return {
    ...rest,
    data: data !== undefined ? mapFn(data as GetData<T, Exclude<TStates, 'empty'>>) : undefined,
    previousData: previousData !== undefined ? mapFn(previousData as GetData<T, Exclude<TStates, 'empty'>>) : undefined
  } as QueryResult<R, TStates>;
}

export function mapMutationResult<TResult extends { data: unknown }, R>(
  result: TResult,
  mapFn: (data: Exclude<TResult['data'], undefined>) => R
): MappedMutationResult<TResult, R> {
  const { data, ...rest } = result;
  return {
    ...rest,
    data: data !== undefined ? mapFn(data as Exclude<TResult['data'], undefined>) : undefined
  } as MappedMutationResult<TResult, R>;
}

export function mapSubscriptionResult<T, R>(result: SubscriptionResult<T>, mapFn: (data: T) => R | undefined): SubscriptionResult<R> {
  const { data, ...rest } = result;
  return {
    ...rest,
    data: data !== undefined ? mapFn(data) : undefined
  };
}
