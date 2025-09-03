import { PluginFunction, PluginValidateFn, Types } from '@graphql-codegen/plugin-helpers';
import { DocumentMode } from '@graphql-codegen/visitor-plugin-common';
import { GraphQLSchema, visit } from 'graphql';
import { extname } from 'path';
import { prepareDocuments } from '../internal/prepareDocuments.js';
import { ApolloOrbitAngularConfig, ApolloOrbitAngularRawConfig } from './config.js';
import { ApolloOrbitAngularVisitor } from './visitor.js';

export const plugin: PluginFunction<ApolloOrbitAngularRawConfig> = (
  schema: GraphQLSchema,
  documents: Array<Types.DocumentFile>,
  config
) => {
  const [allFragments, allAst] = prepareDocuments(documents, config.externalFragments);
  const visitor = new ApolloOrbitAngularVisitor(schema, allFragments, config, documents);
  const visitorResult = visit(allAst, visitor);
  return {
    prepend: visitor.getImports(),
    content: [visitor.fragments, ...visitorResult.definitions.filter((t: unknown): t is string => typeof t === 'string')]
      .filter(definition => typeof definition !== 'undefined')
      .join('\n')
  };
};

export const validate: PluginValidateFn = (
  _schema: GraphQLSchema,
  _documents: Array<Types.DocumentFile>,
  config: ApolloOrbitAngularConfig,
  outputFile: string
): void => {
  if (config.documentMode === DocumentMode.string) {
    throw new Error('Plugin "@apollo-orbit/codegen" does not support \'documentMode: string\' configuration');
  }

  if (extname(outputFile) !== '.ts') {
    throw new Error('Plugin "@apollo-orbit/codegen" requires extension to be ".ts"');
  }
};
