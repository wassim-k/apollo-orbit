import { ApolloError, NetworkStatus, OperationVariables as Variables, TypedDocumentNode } from '@apollo/client/core';

export interface Context extends Record<string, any> { }

export class PureQueryOptions<T = any, V = Variables, C = Context> {
    public constructor(
        public readonly query: TypedDocumentNode<T, V>,
        public readonly variables?: V,
        public readonly context?: C
    ) { }
}

export class PureMutationOptions<T = any, V = Variables, C = Context> {
    public constructor(
        public readonly mutation: TypedDocumentNode<T, V>,
        public readonly variables?: V,
        public readonly context?: C
    ) { }
}

export class PureSubscriptionOptions<T = any, V = Variables> {
    public constructor(
        public readonly query: TypedDocumentNode<T, V>,
        public readonly variables?: V
    ) { }
}

export interface QueryResult<T = any> {
    data?: T;
    error?: ApolloError;
    loading: boolean;
    networkStatus: NetworkStatus;
    partial?: boolean;
    previousData?: T;
}

export interface MutationResult<T = any, C = Context> {
    data?: T;
    error?: ApolloError;
    context?: C;
    extensions?: Record<string, any>;
}

export interface SubscriptionResult<T = any, C = Context> {
    data?: T;
    error?: ApolloError;
    context?: C;
    extensions?: Record<string, any>;
}
