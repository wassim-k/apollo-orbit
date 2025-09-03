import { DataState } from '@apollo/client';
import { Observable, OperatorFunction } from 'rxjs';
import { map } from 'rxjs/operators';
import { GetData, MutationResult, QueryResult, SubscriptionResult } from './types';

export function mapQuery<T, R, TStates extends DataState<T>['dataState']>(
  mapFn: (data: GetData<T, Exclude<TStates, 'empty'>>) => R | undefined
): OperatorFunction<QueryResult<T, TStates>, QueryResult<R, TStates>> {
  return (observable: Observable<QueryResult<T, TStates>>) => observable.pipe(
    map(result => mapQueryResult(result, mapFn))
  );
}

export function mapMutation<T, R>(mapFn: (data: T) => R | undefined): OperatorFunction<MutationResult<T>, MutationResult<R>> {
  return (observable: Observable<MutationResult<T>>) => observable.pipe(
    map(result => mapMutationResult(result, mapFn))
  );
}

export function mapSubscription<T, R>(mapFn: (data: T) => R | undefined): OperatorFunction<SubscriptionResult<T>, SubscriptionResult<R>> {
  return (observable: Observable<SubscriptionResult<T>>) => observable.pipe(
    map(result => mapSubscriptionResult(result, mapFn))
  );
}

export function mapQueryResult<T, R, TStates extends DataState<T>['dataState']>(
  result: QueryResult<T, TStates>,
  mapFn: (data: GetData<T, Exclude<TStates, 'empty'>>) => R | undefined
): QueryResult<R, TStates> {
  const { data, previousData, ...rest } = result;
  return {
    ...rest,
    data: data !== undefined ? mapFn(data as GetData<T, Exclude<TStates, 'empty'>>) : undefined,
    previousData: previousData !== undefined ? mapFn(previousData as GetData<T, Exclude<TStates, 'empty'>>) : undefined
  } as QueryResult<R, TStates>;
}

export function mapMutationResult<T, R>(result: MutationResult<T>, mapFn: (data: T) => R | undefined): MutationResult<R> {
  const { data, ...rest } = result;
  return {
    ...rest,
    data: data !== undefined ? mapFn(data) : undefined
  };
}

export function mapSubscriptionResult<T, R>(result: SubscriptionResult<T>, mapFn: (data: T) => R | undefined): SubscriptionResult<R> {
  const { data, ...rest } = result;
  return {
    ...rest,
    data: data !== undefined ? mapFn(data) : undefined
  };
}
