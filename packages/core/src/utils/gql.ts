import { DocumentNode, TypedDocumentNode } from '@apollo/client/core';
import { FragmentDefinitionNode } from 'graphql';

export interface FragmentIdentifier<TData> {
  id: string;
  fragmentName: string;
  fragment: DocumentNode | TypedDocumentNode<TData>;
}

export function identifyFragment<TData = any>(
  fragment: DocumentNode | TypedDocumentNode<TData>,
  id: string,
  fragmentName?: string
): FragmentIdentifier<TData> {
  const fragmentDefinition = fragment.definitions.find<FragmentDefinitionNode>((definition): definition is FragmentDefinitionNode =>
    definition.kind === 'FragmentDefinition' &&
    (fragmentName === undefined || definition.name.value === fragmentName));

  if (fragmentDefinition === undefined) throw new Error('Fragment definition was not found.');

  return {
    id: `${fragmentDefinition.typeCondition.name.value}:${id}`,
    fragmentName: fragmentName ?? fragmentDefinition.name.value,
    fragment
  };
}
