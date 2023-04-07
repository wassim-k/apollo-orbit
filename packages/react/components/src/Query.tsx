/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import { useQuery } from '@apollo-orbit/react';
import { DocumentNode, OperationVariables, QueryFunctionOptions, QueryResult, TypedDocumentNode } from '@apollo/client';

export interface QueryComponentOptions<TData = any, TVariables extends OperationVariables = OperationVariables> extends QueryFunctionOptions<TData, TVariables> {
    children?: (result: QueryResult<TData, TVariables>) => JSX.Element | null;
    query: DocumentNode | TypedDocumentNode<TData, TVariables>;
}

export function Query<TData = any, TVariables extends OperationVariables = OperationVariables>(props: QueryComponentOptions<TData, TVariables>) {
    const { children, query, ...options } = props;
    const result = useQuery(query, options);
    return children && result ? children(result) : null;
}
