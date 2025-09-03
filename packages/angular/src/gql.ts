import { DocumentNode, TypedDocumentNode } from '@apollo/client';
import { FragmentDefinitionNode } from 'graphql';

export interface FragmentIdentifier<TData> {
  id: string;
  fragmentName: string;
  fragment: DocumentNode | TypedDocumentNode<TData>;
}

export function identifyFragment<TData = unknown>(
  fragment: DocumentNode | TypedDocumentNode<TData>,
  id: string,
  fragmentName?: string
): FragmentIdentifier<TData> {
  const fragmentDefinition = findFragmentDefinition(fragment, fragmentName);

  return {
    id: `${fragmentDefinition.typeCondition.name.value}:${id}`,
    fragmentName: fragmentName ?? fragmentDefinition.name.value,
    fragment
  };
}

export function identifyFragmentType<TData = unknown>(fragment: DocumentNode | TypedDocumentNode<TData>, fragmentName?: string): string {
  return findFragmentDefinition(fragment, fragmentName).typeCondition.name.value;
}

function findFragmentDefinition(fragment: DocumentNode, fragmentName?: string): FragmentDefinitionNode {
  const fragmentDefinition = fragment.definitions.find<FragmentDefinitionNode>((definition): definition is FragmentDefinitionNode =>
    definition.kind === 'FragmentDefinition' &&
    (fragmentName === undefined || definition.name.value === fragmentName));

  if (fragmentDefinition === undefined) throw new Error('Fragment definition was not found.');

  return fragmentDefinition;
}
