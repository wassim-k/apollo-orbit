import { ApolloCache, ApolloClient, ApolloError, DocumentNode, MutationOptions, NormalizedCacheObject, OperationVariables as Variables, PureQueryOptions, QueryOptions, StoreObject, TypedDocumentNode } from '@apollo/client/core';
import { FieldNode, FragmentDefinitionNode } from 'graphql';

export interface Context extends Record<string, any> { }

export type PureMutationOptions<T = any, V = Variables, C = Context> = Pick<MutationOptions<T, V, C>, 'mutation' | 'variables' | 'context'>;

export type Type<T> = new (...args: Array<any>) => T;

export type RefetchQueryDescriptor = Array<string | PureQueryOptions | QueryOptions> | 'all' | 'active';

export type Resolver = (rootValue: any, args: any, context: ResolverContext, info?: ResolverInfo) => any;

export type MutationUpdateFn<T, V> = (cache: ApolloCache<any>, result: MutationInfo<T, V>) => void;

export type EffectFn<T, V> = (result: MutationInfo<T, V>) => void;

export type ActionFn<T> = (action: T, context: ActionContext) => void | Promise<any>;

export type RefetchQueriesFn<T, V> = (result: MutationInfo<T, V>) => RefetchQueryDescriptor;

export type OptimisticResponseFn<T, V, C = Context> = (variables: V, context?: C) => T;

export type TypeField = readonly [string, string];

export type MutationIdentifier<T, V = Variables> = Type<PureMutationOptions<T, V>> | TypedDocumentNode<T, V> | DocumentNode | string;

export interface ActionType<T> {
  type: string;
  new(...args: Array<any>): T;
}

export type ActionInstance = InstanceType<ActionType<any>>;

export interface Action {
  type: string;
}

export interface ActionContext<TCacheShape = any> {
  cache: ApolloCache<TCacheShape>;
  dispatch<TAction extends Action | ActionInstance>(action: TAction): Promise<void>;
}

export interface ActionContextInternal<TCacheShape = any> extends ActionContext<TCacheShape> {
  dispatch<TAction extends Action | ActionInstance>(action: TAction): any;
}

export interface DispatchResult {
  status: 'success' | 'error';
  action: any;
  error?: any;
}

export interface MutationInfo<T = any, V = Variables, C = Context> {
  variables?: V;
  data?: T;
  error?: ApolloError;
  context?: C;
  extensions?: Record<string, any>;
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
