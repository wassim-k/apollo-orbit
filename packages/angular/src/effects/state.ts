import { Variables } from '@apollo-orbit/angular/core';
import { Action, ActionFn as ActionFnCore, ActionType, EffectFn, MutationIdentifier, MutationUpdateFn, OptimisticResponseFn, RefetchQueriesFn, Resolver, STATE_DEFINITION_SYMBOL, State, StateDescriptor as StateDescriptorCore, TypeField } from '@apollo-orbit/core';
import { ApolloCache, PossibleTypesMap, TypePolicies } from '@apollo/client/core';
import { DocumentNode } from 'graphql';
import { Observable, lastValueFrom } from 'rxjs';
import { ActionContext, ActionFn } from './types';

export function state(configure: (descriptor: StateDescriptor) => StateDescriptor | void, definition?: State): State {
  const descriptor = new StateDescriptor(definition);
  configure(descriptor);
  return descriptor[STATE_DEFINITION_SYMBOL];
}

export class StateDescriptor {
  private readonly descriptor: StateDescriptorCore;

  public constructor(definition?: State) {
    this.descriptor = new StateDescriptorCore(definition);
  }

  private get [STATE_DEFINITION_SYMBOL](): State {
    return this.descriptor[STATE_DEFINITION_SYMBOL];
  }

  /**
   * Client name in a multi-client setup
   */
  public clientId(clientId: string): this {
    this.descriptor.clientId(clientId);
    return this;
  }

  public typeDefs(typeDefs: string | Array<string> | DocumentNode | Array<DocumentNode>): this {
    this.descriptor.typeDefs(typeDefs);
    return this;
  }

  public typePolicies(typePolicies: TypePolicies): this {
    this.descriptor.typePolicies(typePolicies);
    return this;
  }

  public possibleTypes(possibleTypes: PossibleTypesMap): this {
    this.descriptor.possibleTypes(possibleTypes);
    return this;
  }

  public onInit(onInit: (cache: ApolloCache<any>) => void): this {
    this.descriptor.onInit(onInit);
    return this;
  }

  public mutationUpdate<T = any, V = Variables>(mutation: MutationIdentifier<T, V>, update: MutationUpdateFn<T, V>): this {
    this.descriptor.mutationUpdate(mutation, update);
    return this;
  }

  public refetchQueries<T = any, V = Variables>(mutation: MutationIdentifier<T, V>, refetchQueries: RefetchQueriesFn<T, V>): this {
    this.descriptor.refetchQueries(mutation, refetchQueries);
    return this;
  }

  public optimisticResponse<T = any, V = Variables>(mutation: MutationIdentifier<T, V>, optimisticResponse: OptimisticResponseFn<T, V>): this {
    this.descriptor.optimisticResponse(mutation, optimisticResponse);
    return this;
  }

  public effect<T = any, V = Variables>(mutation: MutationIdentifier<T, V>, effect: EffectFn<T, V>): this {
    this.descriptor.effect(mutation, effect);
    return this;
  }

  public resolver(typeField: TypeField, resolver: Resolver): this {
    this.descriptor.resolver(typeField, transformResolver(resolver));
    return this;
  }

  public action<T = any>(action: ActionType<T>, actionFn: ActionFn<T>): this;
  public action<TAction extends Action>(type: TAction['type'], actionFn: ActionFn<TAction>): this;
  public action<T = any>(actionType: ActionType<T> | string, actionFn: ActionFn<T>): this {
    this.descriptor.action(actionType, transformActionFn(actionFn));
    return this;
  }
}

function transformResolver(fn: Resolver): Resolver {
  return function (...args: Parameters<Resolver>) {
    const result = fn(...args);
    return result instanceof Observable
      ? lastValueFrom(result, { defaultValue: void 0 })
      : result;
  };
}

function transformActionFn(fn: ActionFn<any>): ActionFnCore<any> {
  return function (action, context) {
    const result = fn(action, context as unknown as ActionContext);
    return result instanceof Observable
      ? lastValueFrom(result, { defaultValue: void 0 })
      : result;
  };
}
