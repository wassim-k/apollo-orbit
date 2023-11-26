/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import { useMutation } from '@apollo-orbit/react';
import { ApolloCache, BaseMutationOptions, DefaultContext, DocumentNode, MutationFunction, MutationResult, OperationVariables, TypedDocumentNode } from '@apollo/client';

export interface MutationComponentOptions<
    TData = any,
    TVariables = OperationVariables,
    TContext = DefaultContext,
    TCache extends ApolloCache<any> = ApolloCache<any>,
> extends BaseMutationOptions<TData, TVariables, TContext, TCache> {
    mutation: DocumentNode | TypedDocumentNode<TData, TVariables>;
    children: (
        mutateFunction: MutationFunction<TData, TVariables, TContext>,
        result: MutationResult<TData>
    ) => JSX.Element | null;
}

export function Mutation<TData = any, TVariables = OperationVariables>(
    props: MutationComponentOptions<TData, TVariables>
) {
    const [runMutation, result] = useMutation(props.mutation, props);
    return props.children ? props.children(runMutation, result) : null;
}
