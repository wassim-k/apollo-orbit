import { ClientSideBasePluginConfig, RawClientSideBasePluginConfig } from '@graphql-codegen/visitor-plugin-common';

export interface ApolloOrbitPluginConfig extends ClientSideBasePluginConfig {
  querySuffix: string;
  mutationSuffix: string;
  subscriptionSuffix: string;
  importPath: string;
  gqlFunction: boolean;
  gqlVariablesAsFunction: boolean;
  documentFieldName?: {
    query?: string;
    mutation?: string;
    subscription?: string;
  };
}

export interface ApolloOrbitRawPluginConfig extends RawClientSideBasePluginConfig {
  /**
   * @name querySuffix
   * @type string
   * @description Allows to define a custom suffix for query operations.
   * @default 'Query'
   *
   * @example graphql.macro
   * ```yml
   * config:
   *   querySuffix: 'Query'
   * ```
   */
  querySuffix?: string;

  /**
   * @name mutationSuffix
   * @type string
   * @description Allows to define a custom suffix for mutation operations.
   * @default 'Mutation'
   *
   * @example graphql.macro
   * ```yml
   * config:
   *   mutationSuffix: 'Mutation'
   * ```
   */
  mutationSuffix?: string;

  /**
   * @name subscriptionSuffix
   * @type string
   * @description Allows to define a custom suffix for Subscription operations.
   * @default 'Subscription'
   *
   * @example graphql.macro
   * ```yml
   * config:
   *   subscriptionSuffix: 'Subscription'
   * ```
   */
  subscriptionSuffix?: string;

  /**
   * @name gqlFunction
   * @type boolean
   * @description Generate a gql function for each operation.
   * @default true
   *
   * @example graphql.macro
   * ```yml
   * config:
   *  gqlFunction: true
   * ```
   */
  gqlFunction?: boolean;

  /**
   * @name gqlVariablesAsFunction
   * @type boolean
   * @description Generate an gql function overload with variables as a function parameter.
   * @default false
   *
   * @example graphql.macro
   * ```yml
   * config:
   *  gqlVariablesAsFunction: true
   * ```
   */
  gqlVariablesAsFunction?: boolean;

  /**
   * @name documentFieldName
   * @type object
   * @description Allows to define a custom field name for the document object in the generated code.
   * @default false
   *
   * @example graphql.macro
   * ```yml
   * config:
   *  documentFieldName:
   *    query: 'query',
   *    mutation: 'mutation',
   *    subscription: 'subscription',
   * ```
   */
  documentFieldName?: {
    query?: string;
    mutation?: string;
    subscription?: string;
  };
}
