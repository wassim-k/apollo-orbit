/* eslint-disable no-restricted-imports */
import { ApolloError, BaseMutationOptions, mergeOptions, MutationFunctionOptions, MutationHookOptions, MutationTuple, OperationVariables as Variables, TypedDocumentNode, useMutation as useMutationCore } from '@apollo/client';
import { DocumentNode } from 'graphql';
import { useContext } from 'react';
import { ApolloOrbitContext } from './context';

interface MutationOptions<TData = any, TVariables = Variables> extends BaseMutationOptions<TData, TVariables> {
  mutation: DocumentNode;
}

export function useMutation<TData = any, TVariables = Variables>(
  mutation: DocumentNode | TypedDocumentNode<TData, TVariables>,
  options: MutationHookOptions<TData, TVariables> = {}
): MutationTuple<TData, TVariables> {
  const { mutationManager } = useContext(ApolloOrbitContext);
  const { onError } = options;
  if (onError) {
    options.onError = (error: ApolloError): void => {
      onError(error);
      mutationManager.runEffects({ mutation, ...options }, undefined, error);
    };
  }

  const [mutationFn, mutationResult] = useMutationCore<TData, TVariables>(mutation, options);
  return [
    (mutationFunctionOptions: MutationFunctionOptions<TData, TVariables> = {}) => {
      const mutationOptions = { mutation, ...options };

      return mutationFn({
        ...mutationFunctionOptions,
        ...mutationManager.withMutationOptions(
          mergeOptions(mutationOptions, mutationFunctionOptions as MutationOptions<TData, TVariables>)
        )
      })
        .then(result => {
          // If onError is set then the effect is handled above by onError
          if (!onError) {
            mutationManager.runEffects(mutationOptions, result, undefined);
          }
          return result;
        })
        .catch((error: ApolloError) => {
          mutationManager.runEffects(mutationOptions, undefined, error);
          throw error;
        });
    },
    mutationResult
  ];
}
