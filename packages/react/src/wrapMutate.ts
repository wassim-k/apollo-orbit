import { MutationManager } from '@apollo-orbit/core';
import { ApolloCache, ApolloClient, MaybeMasked, OperationVariables } from '@apollo/client';

export function wrapMutate(mutationManager: MutationManager, mutate: typeof ApolloClient.prototype['mutate']) {
  return <
    TData = unknown,
    TVariables extends OperationVariables = OperationVariables,
    TCache extends ApolloCache = ApolloCache
  >(options: ApolloClient.MutateOptions<TData, TVariables>): Promise<ApolloClient.MutateResult<MaybeMasked<TData>>> => {
    const wrappedOptions = mutationManager.withMutationOptions<TData, TVariables, TCache>(options);

    return mutate({ ...options, ...wrappedOptions } as ApolloClient.MutateOptions<TData, TVariables>).then(result => {
      const { error } = result;

      if (error) {
        mutationManager.runEffects<TData, TVariables>(options, result, error);
      } else {
        mutationManager.runEffects<TData, TVariables>(options, result, undefined);
      }

      return result;
    }).catch((error: Error) => {
      mutationManager.runEffects<TData, TVariables>(options, undefined, error);
      throw error;
    });
  };
}
