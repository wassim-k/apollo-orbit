import { Cache, DefaultContext, DocumentNode, ErrorLike, InternalRefetchQueriesInclude, Observable, TypedDocumentNode, Unmasked, OperationVariables as Variables } from '@apollo/client';
import { IgnoreModifier } from '@apollo/client/cache';
import { FragmentDefinitionNode, GraphQLFormattedError } from 'graphql';

export type MutationUpdateFn<
  TData,
  TVariables,
  TCache extends Cache.Implementation = Cache.Implementation
> = (cache: TCache, info: MutationInfo<Unmasked<TData>, TVariables>) => void;

export type EffectFn<TData, TVariables> = (info: MutationInfo<TData, TVariables>) => void;

export type ActionFn<TAction> = (action: TAction, context: ActionContext) => void | Promise<any> | Observable<any>;

export type RefetchQueriesFn<TData, TVariables> = (info: MutationInfo<Unmasked<TData>, TVariables>) => InternalRefetchQueriesInclude;

export type OptimisticResponseFn<TData, TVariables> = (variables: TVariables, options: { IGNORE: IgnoreModifier; context?: DefaultContext }) => TData;

export type TypeField = readonly [string, string];

export type MutationIdentifier<TData, TVariables = Variables> =
  | string
  | DocumentNode
  | TypedDocumentNode<TData, TVariables>;

export interface ActionType<T> {
  type: string;
  new(...args: Array<any>): T;
}

export type ActionInstance = InstanceType<ActionType<any>>;

export interface Action {
  type: string;
}

export interface ActionContext {
  cache: Cache.Implementation;
  dispatch: <TAction extends Action | ActionInstance>(action: TAction) => Promise<void>;
}

export interface DispatchResult {
  status: 'success' | 'error';
  action: any;
  error?: any;
}

/** The shapes Apollo Client hands to a mutation callback: its own result, or a raw execution result. */
export interface MutationResultLike<TData> {
  data?: TData | null;
  error?: ErrorLike;
  errors?: ReadonlyArray<GraphQLFormattedError>;
  extensions?: Record<string, any>;
}

export interface MutationInfo<TData = unknown, TVariables = Variables> {
  variables?: TVariables;
  data?: TData;
  error?: ErrorLike;
  context?: DefaultContext;
  extensions?: Record<string, any>;
}

export interface FragmentMap {
  [fragmentName: string]: FragmentDefinitionNode;
}
