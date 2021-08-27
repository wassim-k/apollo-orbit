import { ApolloError, ApolloQueryResult, FetchResult } from '@apollo/client/core';
import { MutationResult, QueryResult, SubscriptionResult } from './types';

export function toQueryResult<T>({ errors, ...result }: ApolloQueryResult<T>): QueryResult<T> {
  const error = errors && errors.length > 0
    ? new ApolloError({ graphQLErrors: errors })
    : result.error;
  return { ...result, error };
}

export function toMutationResult<T, C>(fetchResult: FetchResult<T, C> | undefined, apolloError?: ApolloError): MutationResult<T, C> {
  const { errors, data, context, extensions } = fetchResult ?? {};
  const error = errors && errors.length > 0 ? new ApolloError({ graphQLErrors: errors }) : apolloError;
  return { data: data ?? undefined, error, context, extensions };
}

export function toSubscriptionResult<T, C>(fetchResult: FetchResult<T, C>): SubscriptionResult<T, C> {
  return toMutationResult(fetchResult);
}
