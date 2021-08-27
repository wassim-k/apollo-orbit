import { PureMutationOptions } from '@apollo-orbit/core/common';
import { DocumentNode, OperationVariables as Variables, PossibleTypesMap, TypedDocumentNode, TypePolicies } from '@apollo/client/core';
import { nameOfMutation } from './internal';
import { EffectFn, MutationUpdateFn, OptimisticResponseFn, RefetchQueriesFn, Resolver, Type, TypeField } from './types';
import { createSymbol } from './utils/symbol';

export type MutationIdentifier<T, V = Variables> = Type<PureMutationOptions<T, V>> | TypedDocumentNode<T, V> | DocumentNode | string;

export interface StateDefinition {
  clientId: string;
  typeDefs: Array<string | DocumentNode>;
  typePolicies: Array<TypePolicies>;
  possibleTypes: Array<PossibleTypesMap>;
  resolvers: Array<[TypeField, Resolver]>;
  mutationUpdates: Array<[string, MutationUpdateFn<any, any>]>;
  refetchQueries: Array<[string, RefetchQueriesFn<any, any>]>;
  optimisticResponses: Array<[string, OptimisticResponseFn<any, any>]>;
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
}

function createDefaultStateDefinition(): StateDefinition {
  return {
    clientId: 'default',
    resolvers: [],
    mutationUpdates: [],
    effects: [],
    refetchQueries: [],
    optimisticResponses: [],
    possibleTypes: [],
    typeDefs: [],
    typePolicies: []
  };
}
