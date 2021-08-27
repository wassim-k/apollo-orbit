import { MutationResult, SubscriptionResult } from '@apollo-orbit/core/common';
import { Observable, OperatorFunction } from 'rxjs';
import { map } from 'rxjs/operators';
import { QueryResult } from './types';

export function mapQuery<T, R>(fn: (data: T) => R | undefined): OperatorFunction<QueryResult<T>, QueryResult<R>> {
    return (observable: Observable<QueryResult<T>>) => observable.pipe(
        map((result: QueryResult<T>): QueryResult<R> => {
            const { data, previousData, ...rest } = result;
            return {
                ...rest,
                data: data !== undefined ? fn(data) : undefined,
                previousData: previousData !== undefined ? fn(previousData) : undefined
            };
        })
    );
}

export function mapMutation<T, R>(fn: (data: T) => R | undefined): OperatorFunction<MutationResult<T>, MutationResult<R>> {
    return (observable: Observable<MutationResult<T>>) => observable.pipe(
        map((result: MutationResult<T>): MutationResult<R> => {
            const { data, ...rest } = result;
            return {
                ...rest,
                data: data !== undefined ? fn(data) : undefined
            };
        })
    );
}

export function mapSubscription<T, R>(fn: (data: T) => R | undefined): OperatorFunction<SubscriptionResult<T>, SubscriptionResult<R>> {
    return (observable: Observable<SubscriptionResult<T>>) => observable.pipe(
        map((result: SubscriptionResult<T>): SubscriptionResult<R> => {
            const { data, ...rest } = result;
            return {
                ...rest,
                data: data !== undefined ? fn(data) : undefined
            };
        })
    );
}
