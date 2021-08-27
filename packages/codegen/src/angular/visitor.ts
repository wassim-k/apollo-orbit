import { Types } from '@graphql-codegen/plugin-helpers';
import { LoadedFragment } from '@graphql-codegen/visitor-plugin-common';
import { GraphQLSchema, OperationDefinitionNode } from 'graphql';
import { ApolloOrbitBaseVisitor, OperationType } from '../visitor';
import { ApolloOrbitAngularConfig, ApolloOrbitAngularRawConfig } from './config';

export class ApolloOrbitAngularVisitor extends ApolloOrbitBaseVisitor<ApolloOrbitAngularRawConfig, ApolloOrbitAngularConfig> {
    protected supportsMutationInfo: boolean;
    protected importPath: string;

    public constructor(
        schema: GraphQLSchema,
        fragments: Array<LoadedFragment>,
        rawConfig: ApolloOrbitAngularRawConfig,
        additionalConfig: ApolloOrbitAngularConfig,
        documents?: Array<Types.DocumentFile>
    ) {
        super(schema, fragments, rawConfig, additionalConfig, documents);

        const isCore = rawConfig.importFromCore === true;
        this.supportsMutationInfo = !isCore;
        this.importPath = isCore ? 'angular/core' : 'angular';
    }

    protected buildOperation(
        node: OperationDefinitionNode,
        documentVariableName: string,
        operationType: OperationType,
        operationResultType: string,
        operationVariablesTypes: string
    ): string {
        const { queryObservable } = this.config;
        const content = [super.buildOperation(
            node,
            documentVariableName,
            operationType,
            operationResultType,
            operationVariablesTypes
        )];

        if (queryObservable === true && operationType === 'Query') {
            content.push(this.getQueryObservableExport(node, operationType, operationResultType, operationVariablesTypes));
            content.push('');
        }

        return content.join('\n');
    }

    private getQueryObservableExport(node: OperationDefinitionNode, operationType: string, operationResultType: string, operationVariablesTypes: string): string {
        const operationTypeSuffix: string = this.getOperationSuffix(node, operationType);
        const queryObservableType: string = this.convertName(node, { suffix: `${operationTypeSuffix}Observable` });
        this.registerImport('QueryObservable');
        return `export type ${queryObservableType} = QueryObservable<${operationResultType}, ${operationVariablesTypes}>`;
    }
}
