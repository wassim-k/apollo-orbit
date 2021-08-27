import { ClientSideBasePluginConfig, RawClientSideBasePluginConfig } from '@graphql-codegen/visitor-plugin-common';

export type ApolloOrbitFramework = 'angular' | 'angular/core' | 'react';

export interface ApolloOrbitPluginConfig extends ClientSideBasePluginConfig {
  querySuffix?: string;
  mutationSuffix?: string;
  subscriptionSuffix?: string;
  mutationInfo?: boolean;
}

export interface ApolloOrbitRawPluginConfig extends RawClientSideBasePluginConfig {
  /**
   * @name querySuffix
   * @type string
   * @description Allows to define a custom suffix for query operations.
   * @default 'Operation'
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
   * @default 'Operation'
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
   * @default 'Operation'
   *
   * @example graphql.macro
   * ```yml
   * config:
   *   subscriptionSuffix: 'Subscription'
   * ```
   */
  subscriptionSuffix?: string;

  /**
   * @name mutationInfo
   * @type boolean
   * @description Export helper MutationInfo type for each mutation.
   * @default true
   */
  mutationInfo?: boolean;
}
