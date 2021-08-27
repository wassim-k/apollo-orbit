/* eslint-disable @typescript-eslint/no-var-requires */
import { Types } from '@graphql-codegen/plugin-helpers';
import { ClientSideBaseVisitor, DocumentMode, LoadedFragment } from '@graphql-codegen/visitor-plugin-common';
import { GraphQLSchema, Kind, OperationDefinitionNode } from 'graphql';
import { ApolloOrbitPluginConfig, ApolloOrbitRawPluginConfig } from './config';

const autoBind = require('auto-bind');

export type OperationType = 'Query' | 'Mutation' | 'Subscription';

const alphabetically = (a: string, b: string): number => a.localeCompare(b);

export abstract class ApolloOrbitBaseVisitor<
  TRawConfig extends ApolloOrbitRawPluginConfig = ApolloOrbitRawPluginConfig,
  TPluginConfig extends ApolloOrbitPluginConfig = ApolloOrbitPluginConfig
  > extends ClientSideBaseVisitor<TRawConfig, TPluginConfig> {
  private readonly imports: { [from: string]: Set<string> | undefined } = {};

  protected abstract readonly supportsMutationInfo: boolean;
  protected abstract readonly importPath: string;

  public constructor(
    schema: GraphQLSchema,
    fragments: Array<LoadedFragment>,
    rawConfig: TRawConfig,
    additionalConfig: TPluginConfig,
    documents?: Array<Types.DocumentFile>
  ) {
    super(schema, fragments, rawConfig, additionalConfig, documents);
    autoBind(this);
  }

  public getImports(): Array<string> {
    return [
      ...super.getImports(),
      ...Object
        .keys(this.imports)
        .sort(alphabetically)
        .map(from => {
          const imports = [...this.imports[from]?.values() ?? []];
          return `import { ${imports.sort(alphabetically).join(', ')} } from '${from}';`;
        })
    ];
  }

  protected buildOperation(
    node: OperationDefinitionNode,
    documentVariableName: string,
    operationType: OperationType,
    operationResultType: string,
    operationVariablesTypes: string
  ): string {
    const { mutationInfo } = this.config;
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

    if (this.supportsMutationInfo && mutationInfo === true && operationType === 'Mutation') {
      content.push('');
      content.push(this.getMutationInfoExport(node, operationType, operationResultType, operationVariablesTypes));
    }

    content.push('');
    return content.join('\n');
  }

  protected registerImport(identifier: string, from: string = this.defaultImportFrom): void {
    this.imports[from] = this.imports[from] ?? new Set<string>();
    this.imports[from]?.add(identifier);
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
    return suffixByOperation[operationType] ?? 'Options';
  }

  private get defaultImportFrom(): string {
    return `@apollo-orbit/${this.importPath}`;
  }
}
