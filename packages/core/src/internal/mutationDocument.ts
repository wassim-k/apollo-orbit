import { ApolloClient } from '@apollo/client';
import { DocumentNode, OperationDefinitionNode } from 'graphql';
import { MutationIdentifier } from '../types';

const isDocument = (doc: any): doc is DocumentNode => doc?.kind === 'Document';
const isMutationDocument = (def: any): def is OperationDefinitionNode => def.kind === 'OperationDefinition' && def.operation === 'mutation';

export function nameOfMutation(mutation: MutationIdentifier<any, any>): string {
  if (typeof mutation === 'string') {
    return mutation;
  } else if (typeof mutation === 'function') {
    return nameOfMutationDocument(documentOfGqlFunction(mutation));
  } else if (isDocument(mutation)) {
    return nameOfMutationDocument(mutation);
  } else {
    throw new Error('Invalid mutation identifier');
  }
}

export function documentOfGqlFunction(dataType: (() => Pick<ApolloClient.MutateOptions, 'mutation'>)): DocumentNode {
  const instance = dataType();
  return instance.mutation;
}

export function nameOfMutationDocument(document: DocumentNode): string {
  const def = getMutationDefinition(document);
  if (!def.name) throw new Error('ApolloOrbit requires mutations to have a name.');
  return def.name.value;
}

function getMutationDefinition(document: DocumentNode): OperationDefinitionNode {
  const defs = document.definitions.filter(isMutationDocument);
  if (defs.length === 0) throw new Error('Must contain a mutation definition.');
  return defs[0];
}
