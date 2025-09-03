import { ApolloCache, DefaultContext, DocumentNode, PossibleTypesMap, TypePolicies, OperationVariables as Variables } from '@apollo/client';
import type { LocalState } from '@apollo/client/local-state';
import { identity, lastValueFrom, Observable } from 'rxjs';
import { nameOfMutation } from './internal';
import { Action, ActionFn, ActionType, EffectFn, MutationIdentifier, MutationUpdateFn, OptimisticResponseFn, RefetchQueriesFn, TypeField } from './types';
import { createSymbol } from './utils/symbol';

export interface State {
  clientId: string;
  typePolicies: Array<TypePolicies>;
  possibleTypes: Array<PossibleTypesMap>;
  resolvers: Array<[TypeField, LocalState.Resolver<any, any, any, any>]>;
  mutationUpdates: Array<[string, MutationUpdateFn<any, any, any>]>;
  refetchQueries: Array<[string, RefetchQueriesFn<any, any>]>;
  optimisticResponses: Array<[string, OptimisticResponseFn<any, any>]>;
  actions: Array<[string, ActionFn<any>]>;
  effects: Array<[string, EffectFn<any, any>]>;
  onInit?: (cache: ApolloCache) => void;
}

export const STATE_DEFINITION_SYMBOL: unique symbol = createSymbol('STATE_DEFINITION') as any;

export function state(configure: (descriptor: StateDescriptor) => StateDescriptor | void, definition?: State): State {
  const descriptor = new StateDescriptor(definition);
  configure(descriptor);
  return descriptor[STATE_DEFINITION_SYMBOL];
}

export class StateDescriptor {
  private readonly definition: State;

  public constructor(definition?: State) {
    this.definition = definition ?? createDefaultStateDefinition();
  }

  private get [STATE_DEFINITION_SYMBOL](): State {
    return this.definition;
  }

  /**
   * Client name in a multi-client setup
   */
  public clientId(clientId: string): this {
    this.definition.clientId = clientId;
    return this;
  }

  /**
   * Declares client-side GraphQL schema definitions.
   *
   * This method is a no-op. It only serves as a virtual container for client-side GraphQL schema definitions.
   */
  public typeDefs(typeDefs: string | Array<string> | DocumentNode | Array<DocumentNode>): this {
    identity(typeDefs);
    return this;
  }

  public typePolicies(typePolicies: TypePolicies): this {
    this.definition.typePolicies.push(typePolicies);
    return this;
  }

  public possibleTypes(possibleTypes: PossibleTypesMap): this {
    this.definition.possibleTypes.push(possibleTypes);
    return this;
  }

  public onInit(onInit: (cache: ApolloCache) => void): this {
    this.definition.onInit = onInit;
    return this;
  }

  public resolver<TResult = unknown, TParent = unknown, TContext = DefaultContext, TArgs = Record<string, unknown>>(typeField: TypeField, resolver: LocalState.Resolver<TResult, TParent, TContext, TArgs>): this {
    this.definition.resolvers.push([typeField, transformResolver(resolver)]);
    return this;
  }

  public mutationUpdate<TData = unknown, TVariables = Variables>(mutation: MutationIdentifier<TData, TVariables>, update: MutationUpdateFn<TData, TVariables>): this {
    this.definition.mutationUpdates.push([nameOfMutation(mutation), update]);
    return this;
  }

  public refetchQueries<TData = unknown, TVariables = Variables>(mutation: MutationIdentifier<TData, TVariables>, refetchQueries: RefetchQueriesFn<TData, TVariables>): this {
    this.definition.refetchQueries.push([nameOfMutation(mutation), refetchQueries]);
    return this;
  }

  public optimisticResponse<TData = unknown, TVariables = Variables>(mutation: MutationIdentifier<TData, TVariables>, optimisticResponse: OptimisticResponseFn<TData, TVariables>): this {
    this.definition.optimisticResponses.push([nameOfMutation(mutation), optimisticResponse]);
    return this;
  }

  public effect<TData = unknown, TVariables = Variables>(mutation: MutationIdentifier<TData, TVariables>, effect: EffectFn<TData, TVariables>): this {
    this.definition.effects.push([nameOfMutation(mutation), effect]);
    return this;
  }

  public action<TAction = any>(action: ActionType<TAction>, actionFn: ActionFn<TAction>): this;
  public action<TAction extends Action>(type: TAction['type'], actionFn: ActionFn<TAction>): this;
  public action<TAction = any>(actionType: ActionType<TAction> | string, actionFn: ActionFn<TAction>): this {
    this.definition.actions.push([typeof actionType === 'string' ? actionType : actionType.type, actionFn]);
    return this;
  }
}

function transformResolver(fn: LocalState.Resolver<any, any, any, any>): LocalState.Resolver {
  return function (...args: Parameters<LocalState.Resolver>) {
    const result = fn(...args);
    return result instanceof Observable
      ? lastValueFrom(result, { defaultValue: void 0 })
      : result;
  };
}

function createDefaultStateDefinition(): State {
  return {
    clientId: 'default',
    resolvers: [],
    mutationUpdates: [],
    actions: [],
    effects: [],
    refetchQueries: [],
    optimisticResponses: [],
    possibleTypes: [],
    typePolicies: []
  };
}
