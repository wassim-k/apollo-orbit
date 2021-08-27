/* eslint-disable no-restricted-imports */
import { ApolloError, BaseMutationOptions, MutationFunctionOptions, MutationHookOptions, MutationTuple, OperationVariables as Variables, TypedDocumentNode, useMutation as useMutationCore } from '@apollo/client';
import { DocumentNode } from 'graphql';
import { useContext } from 'react';
import { ApolloOrbitContext } from './context';

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
      const newMutationFunctionOptions = mutationManager.wrapMutationOptions<TData, TVariables>(
        mergeMutationOptions<TData, TVariables>(mutationOptions, mutationFunctionOptions)
      ) as MutationFunctionOptions<TData, TVariables>;

      return mutationFn(newMutationFunctionOptions)
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

interface MutationOptions<TData = any, TVariables = Variables> extends BaseMutationOptions<TData, TVariables> {
  mutation: DocumentNode;
}

function mergeMutationOptions<TData = any, TVariables = Variables>(
  mutationOptions: MutationOptions<TData, TVariables>,
  mutationFunctionOptions: MutationFunctionOptions<TData, TVariables>
): MutationOptions<TData, TVariables> {
  return {
    ...mutationOptions,
    ...mutationFunctionOptions,
    context: { ...mutationOptions.context ?? {}, ...mutationFunctionOptions.context ?? {} },
    variables: { ...mutationOptions.variables ?? {}, ...mutationFunctionOptions.variables ?? {} } as TVariables
  } as MutationOptions<TData, TVariables>;
}
