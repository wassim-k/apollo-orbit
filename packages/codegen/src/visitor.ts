/* eslint-disable @typescript-eslint/no-var-requires */
import { Types } from '@graphql-codegen/plugin-helpers';
import { ClientSideBaseVisitor, DocumentMode, getConfigValue, LoadedFragment } from '@graphql-codegen/visitor-plugin-common';
import autoBind from 'auto-bind';
import { FragmentDefinitionNode, GraphQLSchema, Kind, OperationDefinitionNode } from 'graphql';
import { ApolloOrbitPluginConfig, ApolloOrbitRawPluginConfig } from './config';
import { Importer } from './importer';

export type OperationType = 'Query' | 'Mutation' | 'Subscription';

export abstract class ApolloOrbitBaseVisitor<
  TRawConfig extends ApolloOrbitRawPluginConfig = ApolloOrbitRawPluginConfig,
  TPluginConfig extends ApolloOrbitPluginConfig = ApolloOrbitPluginConfig
  > extends ClientSideBaseVisitor<TRawConfig, TPluginConfig> {
  private readonly importer = new Importer();

  public constructor(
    schema: GraphQLSchema,
    fragments: Array<LoadedFragment>,
    rawConfig: TRawConfig,
    additionalConfig: TPluginConfig,
    documents?: Array<Types.DocumentFile>
  ) {
    super(
      schema,
      fragments,
      {
        gqlImport: `${additionalConfig.importPath}#gql`,
        documentNodeImport: `${additionalConfig.importPath}#TypedDocumentNode`,
        ...rawConfig
      },
      {
        ...additionalConfig,
        querySuffix: getConfigValue(rawConfig.querySuffix, 'Options'),
        mutationSuffix: getConfigValue(rawConfig.mutationSuffix, 'Options'),
        subscriptionSuffix: getConfigValue(rawConfig.subscriptionSuffix, 'Options'),
        mutationInfo: getConfigValue(rawConfig.mutationInfo, true)
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

  protected buildOperation(
    node: OperationDefinitionNode,
    documentVariableName: string,
    operationType: OperationType,
    operationResultType: string,
    operationVariablesTypes: string
  ): string {
    const className = this.convertName(node, { suffix: this.operationSuffix(operationType) });
    const documentNodeVariable = this.getDocumentNodeVariable(node, documentVariableName);
    const hasContext = operationType !== 'Subscription';
    const baseClassName = `Pure${operationType}Options`;

    this.registerImport(baseClassName);

    if (hasContext) {
      this.registerImport('Context');
    }

    const content: Array<string> = [];

    if (this.hasVariables(node)) {
      const isOptionalVariables = !this.hasNonNullVariable(node);
      content.push(`
export class ${className} extends ${baseClassName}<${operationResultType}, ${operationVariablesTypes}> {
  public constructor(variables${isOptionalVariables ? '?' : ''}: ${operationVariablesTypes}${hasContext ? ', context?: Context' : ''}) {
    super(${documentNodeVariable}, variables${hasContext ? ', context' : ''});
  }
}`);
    } else {
      content.push(`
export class ${className} extends ${baseClassName}<${operationResultType}, ${operationVariablesTypes}> {
  public constructor(${hasContext ? 'context?: Context' : ''}) {
    super(${documentNodeVariable}${hasContext ? ', undefined, context' : ''});
  }
}`);
    }

    if (this.config.supportsMutationInfo && this.config.mutationInfo === true && operationType === 'Mutation') {
      content.push('');
      content.push(this.getMutationInfoExport(node, operationType, operationResultType, operationVariablesTypes));
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

  private hasNonNullVariable(node: OperationDefinitionNode): boolean {
    return node.variableDefinitions?.some(variable => variable.type.kind === Kind.NON_NULL_TYPE && !variable.defaultValue) ?? false;
  }

  private getMutationInfoExport(node: OperationDefinitionNode, operationType: string, operationResultType: string, operationVariablesTypes: string): string {
    const operationTypeSuffix: string = this.getOperationSuffix(node, operationType);
    const mutationInfoType: string = this.convertName(node, { suffix: `${operationTypeSuffix}Info` });
    this.registerImport('MutationInfo');
    return `export type ${mutationInfoType} = MutationInfo<${operationResultType}, ${operationVariablesTypes}>`;
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
}
