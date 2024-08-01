import { Types } from '@graphql-codegen/plugin-helpers';
import { LoadedFragment } from '@graphql-codegen/visitor-plugin-common';
import { concatAST, DocumentNode, Kind } from 'graphql';

export function prepareDocuments(documents: Array<Types.DocumentFile>, externalFragments: Array<LoadedFragment> | undefined): [Array<LoadedFragment>, DocumentNode] {
  const allDocumentNodes = documents.map(v => v.document).filter((d): d is DocumentNode => d !== undefined);
  const allAst = concatAST(allDocumentNodes);
  const allFragments: Array<LoadedFragment> = [
    ...(allAst.definitions.filter(d => d.kind === Kind.FRAGMENT_DEFINITION)).map(fragmentDef => ({
      node: fragmentDef,
      name: fragmentDef.name.value,
      onType: fragmentDef.typeCondition.name.value,
      isExternal: false
    })),
    ...externalFragments ?? []
  ];
  return [allFragments, allAst];
}
