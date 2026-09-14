import { MutationManager } from '@apollo-orbit/core';
import { Cache, ApolloClient, MaybeMasked, OperationVariables } from '@apollo/client';

export function wrapMutate(mutationManager: MutationManager, mutate: typeof ApolloClient.prototype['mutate']) {
  return <
    TData = unknown,
    TVariables extends OperationVariables = OperationVariables,
    TCache extends Cache.Implementation = Cache.Implementation
  >(options: ApolloClient.MutateOptions<TData, TVariables>): Promise<ApolloClient.MutateResult<MaybeMasked<TData>>> => {
    const wrappedOptions = mutationManager.withMutationOptions<TData, TVariables, TCache>(options);

    return mutate({ ...options, ...wrappedOptions } as ApolloClient.MutateOptions<TData, TVariables>).then(
      result => {
        mutationManager.runEffects<TData, TVariables>(options, result, result.error);
        return result;
      },
      (error: Error) => {
        mutationManager.runEffects<TData, TVariables>(options, undefined, error);
        throw error;
      }
    );
  };
}
