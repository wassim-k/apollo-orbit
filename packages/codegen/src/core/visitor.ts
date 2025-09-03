import { Types } from '@graphql-codegen/plugin-helpers';
import { ClientSideBaseVisitor, DocumentMode, getConfigValue, LoadedFragment } from '@graphql-codegen/visitor-plugin-common';
import autoBind from 'auto-bind';
import { constantCase, pascalCase } from 'change-case-all';
import { FragmentDefinitionNode, GraphQLSchema, OperationDefinitionNode } from 'graphql';
import { Importer } from '../internal/importer.js';
import { ApolloOrbitPluginConfig, ApolloOrbitRawPluginConfig } from './config.js';

export type OperationType = 'Query' | 'Mutation' | 'Subscription';

const DOCUMENT_VARIABLE_OPERATION_SUFFIX = '[OPERATION]';

export class ApolloOrbitVisitor<
  TRawConfig extends ApolloOrbitRawPluginConfig = ApolloOrbitRawPluginConfig,
  TPluginConfig extends ApolloOrbitPluginConfig = ApolloOrbitPluginConfig
> extends ClientSideBaseVisitor<TRawConfig, TPluginConfig> {
  private readonly importer = new Importer();

  public constructor(
    schema: GraphQLSchema,
    fragments: Array<LoadedFragment>,
    rawConfig: TRawConfig,
    additionalConfig: Partial<TPluginConfig>,
    documents?: Array<Types.DocumentFile>
  ) {
    super(
      schema,
      fragments,
      {
        gqlImport: `${additionalConfig.importPath ?? '@apollo/client'}#gql`,
        documentNodeImport: `${additionalConfig.importPath ?? '@apollo/client'}#TypedDocumentNode`,
        dedupeOperationSuffix: true,
        documentVariableSuffix: getConfigValue(rawConfig.documentVariableSuffix, DOCUMENT_VARIABLE_OPERATION_SUFFIX),
        ...rawConfig
      },
      {
        querySuffix: getConfigValue(rawConfig.querySuffix, 'Query'),
        mutationSuffix: getConfigValue(rawConfig.mutationSuffix, 'Mutation'),
        subscriptionSuffix: getConfigValue(rawConfig.subscriptionSuffix, 'Subscription'),
        gqlFunction: getConfigValue(rawConfig.gqlFunction, false),
        gqlVariablesAsFunction: getConfigValue(rawConfig.gqlVariablesAsFunction, false),
        ...additionalConfig
      },
      documents);

    autoBind(this);

    if (this.config.documentMode === undefined || this.config.documentMode === DocumentMode.graphQLTag) {
      const documentNodeImport = this._parseImport(this.config.documentNodeImport || 'graphql#DocumentNode');
      this.registerImport(documentNodeImport.propName, documentNodeImport.moduleName as string, 'DocumentNode');
    }
  }

  public getImports(): Array<string> {
    return [
      ...super.getImports(),
      ...this.importer.getImports()
    ];
  }

  public getOperationVariableName(node: OperationDefinitionNode): string {
    return constantCase(this.convertName(node, {
      suffix: this.config.documentVariableSuffix === DOCUMENT_VARIABLE_OPERATION_SUFFIX
        ? this.getOperationSuffix(node, pascalCase(node.operation))
        : this.config.documentVariableSuffix,
      prefix: this.config.documentVariablePrefix
    }));
  }

  protected buildOperation(
    node: OperationDefinitionNode,
    documentVariableName: string,
    operationType: OperationType,
    _dataType: string,
    variablesTypes: string,
    hasRequiredVariables: boolean
  ): string {
    if (!this.config.gqlFunction) return '';

    const functionName = `gql${this.convertName(node, { suffix: this.operationSuffix(operationType) })}`;
    const documentNodeVariable = this.getDocumentNodeVariable(node, documentVariableName);
    const documentFieldName = this.getDocumentFieldName(operationType);

    const content: Array<string> = [];

    switch (operationType) {
      case 'Query':
      case 'Subscription':
        if (this.hasVariables(node)) {
          const isOptional = !hasRequiredVariables;

          content.push('');

          if (!this.config.gqlVariablesAsFunction) {
            content.push(`export function ${functionName}(variables${isOptional ? '?' : ''}: ${variablesTypes}) {
  return {
    ${documentFieldName}: ${documentNodeVariable},
    variables
  };
}`);
          } else {
            if (isOptional) {
              content.push(`export function ${functionName}(): ${this.createDocumentOnlyReturnType(documentFieldName, documentNodeVariable)};`);
            }
            content.push(`export function ${functionName}(variables${isOptional ? '?' : ''}: ${variablesTypes}): ${this.createDocumentReturnType(documentFieldName, documentNodeVariable)};
export function ${functionName}(variables: () => ${variablesTypes}${isOptional ? ' | undefined' : ''}): ${this.createDocumentReturnType(documentFieldName, documentNodeVariable)};
export function ${functionName}(variables${isOptional ? '?' : ''}: any): any {
  return {
    ${documentFieldName}: ${documentNodeVariable},
    variables
  };
}`);
          }
        } else {
          content.push(`
export function ${functionName}(): ${this.createDocumentOnlyReturnType(documentFieldName, documentNodeVariable)} {
  return {
    ${documentFieldName}: ${documentNodeVariable}
  };
}`);
        }
        break;

      case 'Mutation':
        if (this.hasVariables(node)) {
          const isOptional = !hasRequiredVariables;

          content.push('');

          content.push(`export function ${functionName}(variables${isOptional ? '?' : ''}: ${variablesTypes}): ${this.createDocumentReturnType(documentFieldName, documentNodeVariable)} {
  return {
    ${documentFieldName}: ${documentNodeVariable},
    variables
  };
}`);
        } else {
          content.push(`
export function ${functionName}(): ${this.createDocumentOnlyReturnType(documentFieldName, documentNodeVariable)} {
  return {
    ${documentFieldName}: ${documentNodeVariable}
  };
}`);
        }
        break;
      default: throw new Error(`Unsupported operation type: ${operationType}`);
    }

    content.push('');
    return content.join('\n');
  }

  protected getDocumentNodeSignature(resultType: string, variablesTypes: string, node: FragmentDefinitionNode | OperationDefinitionNode): string {
    if (
      this.config.documentMode === DocumentMode.documentNode ||
      this.config.documentMode === DocumentMode.documentNodeImportFragments ||
      this.config.documentMode === DocumentMode.graphQLTag
    ) {
      return ` as DocumentNode<${resultType}, ${variablesTypes}>`;
    }

    return super.getDocumentNodeSignature(resultType, variablesTypes, node);
  }

  protected registerImport(identifier: string, from?: string, as?: string): void {
    this.importer.registerImport(identifier, from ?? this.config.importPath, as);
  }

  private hasVariables(node: OperationDefinitionNode): boolean {
    return node.variableDefinitions !== undefined && node.variableDefinitions.length > 0;
  }

  private getDocumentNodeVariable(node: OperationDefinitionNode, documentVariableName: string): string {
    if (!node.name) throw new Error('Operation node must have a name.');
    return this.config.documentMode === DocumentMode.external ? `Operations.${node.name.value}` : documentVariableName;
  }

  private operationSuffix(operationType: OperationType): string {
    const { querySuffix, mutationSuffix, subscriptionSuffix } = this.config;
    const suffixByOperation = {
      Query: querySuffix,
      Mutation: mutationSuffix,
      Subscription: subscriptionSuffix
    };
    return suffixByOperation[operationType];
  }

  private getDocumentFieldName(operationType: OperationType): string {
    switch (operationType) {
      case 'Query': return this.config.documentFieldName?.query ?? 'query';
      case 'Mutation': return this.config.documentFieldName?.mutation ?? 'mutation';
      case 'Subscription': return this.config.documentFieldName?.subscription ?? 'subscription';
      default: throw new Error(`Unsupported operation type: ${operationType}`);
    }
  }

  private createDocumentOnlyReturnType(documentFieldName: string, documentNodeVariable: string): string {
    return `{ ${documentFieldName}: typeof ${documentNodeVariable} }`;
  }

  private createDocumentReturnType(documentFieldName: string, documentNodeVariable: string): string {
    return `{ ${documentFieldName}: typeof ${documentNodeVariable}, variables: typeof variables }`;
  }
}
