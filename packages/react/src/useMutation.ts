/* eslint-disable no-shadow */
/* eslint-disable no-restricted-imports */

import { ApolloCache, ApolloError, BaseMutationOptions, DefaultContext, MutationFunctionOptions, MutationHookOptions, MutationTuple, NoInfer, OperationVariables, TypedDocumentNode, mergeOptions, useMutation as useMutationCore } from '@apollo/client';
import { DocumentNode } from 'graphql';
import { useCallback, useContext, useRef } from 'react';
import { ApolloOrbitContext } from './context';

interface MutationOptions<
  TData = any,
  TVariables = OperationVariables,
  TContext = DefaultContext,
  TCache extends ApolloCache<any> = ApolloCache<any>
> extends BaseMutationOptions<TData, TVariables, TContext, TCache> {
  mutation: DocumentNode;
}

export function useMutation<
  TData = any,
  TVariables = OperationVariables,
  TContext = DefaultContext,
  TCache extends ApolloCache<any> = ApolloCache<any>,
>(
  mutation: DocumentNode | TypedDocumentNode<TData, TVariables>,
  options?: MutationHookOptions<
    NoInfer<TData>,
    NoInfer<TVariables>,
    TContext,
    TCache
  >
): MutationTuple<TData, TVariables, TContext, TCache> {
  const { mutationManager } = useContext(ApolloOrbitContext);

  const [mutationFn, mutationResult] = useMutationCore(mutation, options);

  const ref = useRef({
    mutationFn,
    mutationManager,
    mutation,
    options
  });

  Object.assign(ref.current, { mutationFn, mutationManager, options, mutation });

  const execute = useCallback(
    (executeOptions: MutationFunctionOptions<TData, TVariables, TContext, TCache> = {}) => {
      const { options, mutation } = ref.current;
      const baseOptions = { ...options, mutation };
      const clientOptions: MutationOptions<TData, TVariables, TContext, TCache> = mergeOptions(baseOptions as any, executeOptions as any);
      const wrappedOptions = ref.current.mutationManager.withMutationOptions<TData, TVariables, TContext, TCache>(clientOptions);

      const originalOnError = clientOptions.onError;
      const onError = originalOnError
        ? (error: ApolloError, clientOptions?: BaseMutationOptions): void => {
          originalOnError(error, clientOptions);
          const { variables, context } = clientOptions as MutationOptions<TData, TVariables, TContext, TCache>;
          ref.current.mutationManager.runEffects<TData, TVariables, TContext>({ mutation: ref.current.mutation, variables, context }, undefined, error);
        }
        : originalOnError;

      return ref.current.mutationFn({ ...executeOptions, ...wrappedOptions, onError }).then(result => {
        // If onError is set then the error effect is handled above by onError
        if (!onError) {
          ref.current.mutationManager.runEffects<TData, TVariables, TContext>(clientOptions, result, undefined);
        }
        return result;
      }).catch((error: ApolloError) => {
        ref.current.mutationManager.runEffects<TData, TVariables, TContext>(clientOptions, undefined, error);
        throw error;
      });
    },
    []
  );

  return [execute, mutationResult];
}
