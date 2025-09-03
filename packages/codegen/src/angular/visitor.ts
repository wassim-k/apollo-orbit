import { Types } from '@graphql-codegen/plugin-helpers';
import { getConfigValue, LoadedFragment } from '@graphql-codegen/visitor-plugin-common';
import { GraphQLSchema, OperationDefinitionNode } from 'graphql';
import { ApolloOrbitVisitor, OperationType } from '../core/visitor.js';
import { ApolloOrbitAngularConfig, ApolloOrbitAngularRawConfig } from './config.js';

export class ApolloOrbitAngularVisitor extends ApolloOrbitVisitor<ApolloOrbitAngularRawConfig, ApolloOrbitAngularConfig> {
  public constructor(
    schema: GraphQLSchema,
    fragments: Array<LoadedFragment>,
    rawConfig: ApolloOrbitAngularRawConfig,
    documents?: Array<Types.DocumentFile>
  ) {
    super(
      schema,
      fragments,
      rawConfig,
      {
        importPath: '@apollo-orbit/angular',
        gqlFunction: getConfigValue(rawConfig.gqlFunction, true),
        gqlVariablesAsFunction: getConfigValue(rawConfig.gqlVariablesAsFunction, true),
        documentFieldName: getConfigValue(rawConfig.documentFieldName, {
          query: 'query',
          mutation: 'mutation',
          subscription: 'subscription'
        })
      } as ApolloOrbitAngularConfig,
      documents
    );
  }

  protected buildOperation(
    node: OperationDefinitionNode,
    documentVariableName: string,
    operationType: OperationType,
    operationResultType: string,
    operationVariablesTypes: string,
    hasRequiredVariables: boolean
  ): string {
    return super.buildOperation(
      node,
      documentVariableName,
      operationType,
      operationResultType,
      operationVariablesTypes,
      hasRequiredVariables
    );
  }
}
