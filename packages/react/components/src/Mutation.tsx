/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import { useMutation } from '@apollo-orbit/react';
import { BaseMutationOptions, DocumentNode, MutationFunction, MutationResult, OperationVariables, TypedDocumentNode } from '@apollo/client';

export interface MutationComponentOptions<TData = any, TVariables = OperationVariables> extends BaseMutationOptions<TData, TVariables> {
    mutation: DocumentNode | TypedDocumentNode<TData, TVariables>;
    children: (
        mutateFunction: MutationFunction<TData, TVariables>,
        result: MutationResult<TData>
    ) => JSX.Element | null;
}

export function Mutation<TData = any, TVariables = OperationVariables>(
    props: MutationComponentOptions<TData, TVariables>
) {
    const [runMutation, result] = useMutation(props.mutation, props);
    return props.children ? props.children(runMutation, result) : null;
}
