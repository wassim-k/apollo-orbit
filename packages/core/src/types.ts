import { Context, MutationResult, PureQueryOptions } from '@apollo-orbit/core/common';
import { ApolloCache, ApolloClient, NormalizedCacheObject, OperationVariables as Variables, QueryOptions, StoreObject } from '@apollo/client/core';
import { FieldNode, FragmentDefinitionNode } from 'graphql';

export type Type<T> = new (...args: Array<any>) => T;

export type TransformResolver = (resolver: Resolver) => Resolver;

export type RefetchQueryDescriptor = Array<string | PureQueryOptions | QueryOptions> | 'all' | 'active';

export type Resolver = (rootValue: any, args: any, context: ResolverContext, info?: ResolverInfo) => any;

export type MutationUpdateFn<T, V> = (cache: ApolloCache<any>, result: MutationInfo<T, V>) => void;

export type EffectFn<T, V> = (result: MutationInfo<T, V>) => void;

export type RefetchQueriesFn<T, V> = (result: MutationInfo<T, V>) => RefetchQueryDescriptor;

export type OptimisticResponseFn<T, V, C = Context> = (variables: V, context?: C) => T;

export type TypeField = readonly [string, string];

export interface MutationInfo<T = any, V = Variables, C = Context> extends MutationResult<T, C> {
  variables?: V;
}

export interface ResolverContext {
  [key: string]: any;
  cache: ApolloCache<any>;
  client: ApolloClient<NormalizedCacheObject>;
  clientAwareness: Record<string, string>;
  getCacheKey(obj: StoreObject): string | undefined;
}

export interface ResolverInfo {
  field: FieldNode;
  fragmentMap: FragmentMap;
}

export interface FragmentMap {
  [fragmentName: string]: FragmentDefinitionNode;
}
