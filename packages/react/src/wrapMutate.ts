import { MutationManager } from '@apollo-orbit/core';
import { ApolloCache, ApolloClient, ApolloError, DefaultContext, FetchResult, MutationOptions, OperationVariables } from '@apollo/client';

export function wrapMutate(mutationManager: MutationManager, mutate: typeof ApolloClient.prototype['mutate']) {
  return <
    TData = any,
    TVariables extends OperationVariables = OperationVariables,
    TContext extends Record<string, any> = DefaultContext,
    TCache extends ApolloCache<any> = ApolloCache<any>,
  >(
    options: MutationOptions<TData, TVariables, TContext>
  ): Promise<FetchResult<TData>> => {
    const wrappedOptions = mutationManager.withMutationOptions<TData, TVariables, TContext, TCache>(options);

    return mutate({ ...options, ...wrappedOptions } as MutationOptions<TData, TVariables, TContext>).then(result => {
      const { errors } = result;
      const error = errors && errors.length > 0
        ? new ApolloError({ graphQLErrors: errors })
        : void 0;

      if (error) {
        mutationManager.runEffects<TData, TVariables, TContext>(options, result, error);
      } else {
        mutationManager.runEffects<TData, TVariables, TContext>(options, result, undefined);
      }

      return result;
    }).catch((error: ApolloError) => {
      mutationManager.runEffects<TData, TVariables, TContext>(options, undefined, error);
      throw error;
    });
  };
}
