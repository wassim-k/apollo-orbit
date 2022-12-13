import { ApolloError, ApolloQueryResult, FetchResult } from '@apollo/client/core';
import { GraphQLError } from 'graphql';
import { MutationResult, QueryResult, SubscriptionResult } from './types';

export function toQueryResult<T>({ errors, ...result }: ApolloQueryResult<T>): QueryResult<T> {
  return {
    ...result,
    error: getApolloError(errors, result.error)
  };
}

export function toMutationResult<T, C>(fetchResult: FetchResult<T, C> | undefined, apolloError?: ApolloError): MutationResult<T, C> {
  fetchResult ??= {};
  const { errors, data, extensions } = fetchResult;
  const context = 'context' in fetchResult ? fetchResult.context : undefined;
  return {
    data: data ?? undefined,
    error: getApolloError(errors, apolloError),
    context,
    extensions
  };
}

export function toSubscriptionResult<T, C>(fetchResult: FetchResult<T, C>): SubscriptionResult<T, C> {
  return toMutationResult(fetchResult);
}

function getApolloError(graphQLErrors: ReadonlyArray<GraphQLError> | undefined, apolloError: ApolloError | undefined): ApolloError | undefined {
  return graphQLErrors && graphQLErrors.length > 0 ? new ApolloError({ graphQLErrors }) : apolloError;
}
