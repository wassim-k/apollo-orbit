import { useSubscription } from '@apollo-orbit/react';
import { BaseSubscriptionOptions, OperationVariables, SubscriptionResult, TypedDocumentNode } from '@apollo/client';
import { DocumentNode } from 'graphql';

export interface SubscriptionComponentOptions<TData = any, TVariables extends OperationVariables = OperationVariables> extends BaseSubscriptionOptions<TData, TVariables> {
    subscription: DocumentNode | TypedDocumentNode<TData, TVariables>;
    children?: null | ((result: SubscriptionResult<TData>) => JSX.Element | null);
}

export function Subscription<TData = any, TVariables extends OperationVariables = OperationVariables>(props: SubscriptionComponentOptions<TData, TVariables>) {
    const result = useSubscription(props.subscription, props);
    return props.children && typeof result !== 'undefined' ? props.children(result) : null;
}
