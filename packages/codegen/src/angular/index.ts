import { PluginFunction, PluginValidateFn, Types } from '@graphql-codegen/plugin-helpers';
import { GraphQLSchema, visit } from 'graphql';
import { prepareDocuments } from '../prepareDocuments';
import { ApolloOrbitAngularConfig, ApolloOrbitAngularRawConfig } from './config';
import { ApolloOrbitAngularVisitor } from './visitor';

export const plugin: PluginFunction<ApolloOrbitAngularRawConfig> = (
    schema: GraphQLSchema,
    documents: Array<Types.DocumentFile>,
    config
) => {
    const { querySuffix, mutationSuffix, subscriptionSuffix, mutationInfo = true, queryObservable = true, importFromCore, externalFragments } = config;
    const additionalConfig: ApolloOrbitAngularConfig = {
        mutationInfo,
        querySuffix,
        mutationSuffix,
        subscriptionSuffix,
        importFromCore,
        queryObservable
    } as ApolloOrbitAngularConfig;
    const [allFragments, allAst] = prepareDocuments(documents, externalFragments);
    const visitor = new ApolloOrbitAngularVisitor(schema, allFragments, config, additionalConfig, documents);
    const visitorResult = visit(allAst, visitor);
    return {
        prepend: visitor.getImports(),
        content: [
            visitor.fragments,
            ...visitorResult.definitions.filter((t: unknown): t is string => typeof t === 'string')
        ]
            .filter(a => a)
            .join('\n')
    };
};

export const validate: PluginValidateFn = (
    _schema: GraphQLSchema,
    _documents: Array<Types.DocumentFile>,
    _config: ApolloOrbitAngularConfig,
    _outputFile: string
): void => {
    return undefined;
};
