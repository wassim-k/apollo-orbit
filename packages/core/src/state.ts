import { DocumentNode, PossibleTypesMap, TypePolicies, OperationVariables as Variables } from '@apollo/client/core';
import { nameOfMutation } from './internal';
import { Action, ActionFn, ActionType, EffectFn, MutationIdentifier, MutationUpdateFn, OptimisticResponseFn, RefetchQueriesFn, Resolver, TypeField } from './types';
import { createSymbol } from './utils/symbol';

export interface StateDefinition {
  clientId: string;
  typeDefs: Array<string | DocumentNode>;
  typePolicies: Array<TypePolicies>;
  possibleTypes: Array<PossibleTypesMap>;
  resolvers: Array<[TypeField, Resolver]>;
  mutationUpdates: Array<[string, MutationUpdateFn<any, any, any, any>]>;
  refetchQueries: Array<[string, RefetchQueriesFn<any, any, any>]>;
  optimisticResponses: Array<[string, OptimisticResponseFn<any, any>]>;
  actions: Array<[string, ActionFn<any>]>;
  effects: Array<[string, EffectFn<any, any>]>;
  onInit?: () => void;
}

const definitionSymbol: unique symbol = createSymbol('definition') as any;

export function state(configure: (descriptor: StateDescriptor) => StateDescriptor | void, definition?: StateDefinition): StateDefinition {
  const descriptor = new StateDescriptor(definition);
  configure(descriptor);
  return descriptor[definitionSymbol];
}

export class StateDescriptor {
  private readonly definition: StateDefinition;

  public constructor(definition?: StateDefinition) {
    this.definition = definition ?? createDefaultStateDefinition();
  }

  public get [definitionSymbol](): StateDefinition {
    return this.definition;
  }

  /**
   * Client name in a multi-client setup
   */
  public clientId(clientId: string): this {
    this.definition.clientId = clientId;
    return this;
  }

  public typeDefs(typeDefs: string | Array<string> | DocumentNode | Array<DocumentNode>): this {
    this.definition.typeDefs.push(...(Array.isArray(typeDefs) ? typeDefs : [typeDefs]));
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

  public onInit(onInit: () => void): this {
    this.definition.onInit = onInit;
    return this;
  }

  public resolver(typeField: TypeField, resolver: Resolver): this {
    this.definition.resolvers.push([typeField, resolver]);
    return this;
  }

  public mutationUpdate<T = any, V = Variables>(mutation: MutationIdentifier<T, V>, mutationUpdate: MutationUpdateFn<T, V>): this {
    this.definition.mutationUpdates.push([nameOfMutation(mutation), mutationUpdate]);
    return this;
  }

  public refetchQueries<T = any, V = Variables>(mutation: MutationIdentifier<T, V>, refetchQueries: RefetchQueriesFn<T, V>): this {
    this.definition.refetchQueries.push([nameOfMutation(mutation), refetchQueries]);
    return this;
  }

  public optimisticResponse<T = any, V = Variables>(mutation: MutationIdentifier<T, V>, optimisticResponse: OptimisticResponseFn<T, V>): this {
    this.definition.optimisticResponses.push([nameOfMutation(mutation), optimisticResponse]);
    return this;
  }

  public effect<T = any, V = Variables>(mutation: MutationIdentifier<T, V>, effect: EffectFn<T, V>): this {
    this.definition.effects.push([nameOfMutation(mutation), effect]);
    return this;
  }

  public action<T = any>(action: ActionType<T>, actionFn: ActionFn<T>): this;
  public action<TAction extends Action>(type: TAction['type'], actionFn: ActionFn<TAction>): this;
  public action<T = any>(actionType: ActionType<T> | string, actionFn: ActionFn<T>): this {
    this.definition.actions.push([typeof actionType === 'string' ? actionType : actionType.type, actionFn]);
    return this;
  }
}

function createDefaultStateDefinition(): StateDefinition {
  return {
    clientId: 'default',
    resolvers: [],
    mutationUpdates: [],
    actions: [],
    effects: [],
    refetchQueries: [],
    optimisticResponses: [],
    possibleTypes: [],
    typeDefs: [],
    typePolicies: []
  };
}
