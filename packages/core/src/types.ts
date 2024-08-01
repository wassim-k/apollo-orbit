import { ApolloCache, ApolloClient, ApolloError, DocumentNode, InternalRefetchQueriesInclude, MutationOptions, NormalizedCacheObject, PureQueryOptions, QueryOptions, StoreObject, TypedDocumentNode, OperationVariables as Variables } from '@apollo/client/core';
import { FieldNode, FragmentDefinitionNode } from 'graphql';

export interface Context extends Record<string, any> { }

export type PureMutationOptions<TData = any, TVariables = Variables, TContext = Context> = Pick<MutationOptions<TData, TVariables, TContext>, 'mutation' | 'variables' | 'context'>;

export type Type<T> = new (...args: Array<any>) => T;

export type RefetchQueryDescriptor = Array<string | DocumentNode | PureQueryOptions | QueryOptions> | 'all' | 'active';

export type Resolver = (rootValue: any, args: any, context: ResolverContext, info?: ResolverInfo) => any;

export type MutationUpdateFn<
  TData,
  TVariables,
  TContext = Context,
  TCache extends ApolloCache<any> = ApolloCache<any>
> = (cache: TCache, info: MutationInfo<TData, TVariables, TContext>) => void;

export type EffectFn<TData, TVariables, TContext = Context> = (info: MutationInfo<TData, TVariables, TContext>) => void;

export type ActionFn<T> = (action: T, context: ActionContext) => void | Promise<any>;

export type RefetchQueriesFn<TData, TVariables, TContext = Context> = (info: MutationInfo<TData, TVariables, TContext>) => InternalRefetchQueriesInclude;

export type OptimisticResponseFn<TData, TVariables, TContext = Context> = (variables: TVariables, context?: TContext) => TData;

export type TypeField = readonly [string, string];

export type MutationIdentifier<TData, TVariables = Variables> = Type<PureMutationOptions<TData, TVariables>> | TypedDocumentNode<TData, TVariables> | DocumentNode | string;

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
