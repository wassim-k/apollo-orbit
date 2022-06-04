import { DataProxy, DocumentNode, TypedDocumentNode } from '@apollo/client/core';
import { FragmentDefinitionNode } from 'graphql';

export function identifyFragment<TData = any, TVariables = any>(
    fragment: DocumentNode | TypedDocumentNode<TData, TVariables>,
    id: string,
    fragmentName?: string,
    variables?: TVariables
): DataProxy.Fragment<TVariables, TData> {
    const fragmentDefinition = fragment.definitions.find<FragmentDefinitionNode>((definition): definition is FragmentDefinitionNode => definition.kind === 'FragmentDefinition');
    if (fragmentDefinition === undefined) throw new Error('Invalid fragment document.');
    return {
        id: `${fragmentDefinition.typeCondition.name.value}:${id}`,
        fragmentName: fragmentName ?? fragmentDefinition.name.value,
        fragment,
        variables
    };
}
