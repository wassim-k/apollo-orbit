import { BaseSubscriptionOptions, OperationVariables, SubscriptionResult, TypedDocumentNode, useSubscription } from '@apollo/client';
import { DocumentNode } from 'graphql';

export interface SubscriptionComponentOptions<
    TData = any,
    TVariables extends OperationVariables = OperationVariables,
> extends BaseSubscriptionOptions<TData, TVariables> {
    subscription: DocumentNode | TypedDocumentNode<TData, TVariables>;
    children?: null | ((result: SubscriptionResult<TData>) => JSX.Element | null);
}

export function Subscription<
    TData = any,
    TVariables extends OperationVariables = OperationVariables,
>(props: SubscriptionComponentOptions<TData, TVariables>) {
    const result = useSubscription(props.subscription, props);
    return props.children ? props.children(result) : null;
}
