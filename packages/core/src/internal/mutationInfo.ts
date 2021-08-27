import { Context, toMutationResult } from '@apollo-orbit/core/common';
import { ApolloError, FetchResult, MutationOptions, OperationVariables as Variables } from '@apollo/client/core';
import { MutationInfo } from '../types';

export function toMutationInfo<T, V = Variables, C = Context>(
  options: Pick<MutationOptions<T, V>, 'variables' | 'context'>,
  fetchResult: FetchResult<T> | undefined,
  apolloError?: ApolloError
): MutationInfo<T, V, C> {
  const { variables, context: optionsContext } = options;
  const { data, error, extensions, context: resultContext } = toMutationResult(fetchResult, apolloError);
  const context = resultContext !== undefined || optionsContext !== undefined
    ? { ...resultContext ?? {}, ...optionsContext ?? {} } as C
    : undefined;
  return { data, error, variables, context, extensions };
}
