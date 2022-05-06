import { createSymbol, state, StateDefinition, StateDescriptor, Type } from '@apollo-orbit/core';

const stateDefinitionSymbol: unique symbol = createSymbol('stateDefinition') as any;

export interface StateClass extends Type<any> {
  [stateDefinitionSymbol]: StateDefinition | undefined;
}

export function updateStateDefinition(stateClass: StateClass, configure: (descriptor: StateDescriptor) => StateDescriptor | void): void {
  stateClass[stateDefinitionSymbol] = state(configure, stateClass[stateDefinitionSymbol]);
}

export function bindStateDefinition(stateClass: StateClass, instance: any): StateDefinition {
  const { actions, effects, mutationUpdates, optimisticResponses, refetchQueries, resolvers, onInit, ...rest } = stateClass[stateDefinitionSymbol] as StateDefinition;
  return {
    ...rest,
    onInit: onInit?.bind(instance),
    actions: actions.map(([type, fn]) => [type, fn.bind(instance)]),
    effects: effects.map(([identifier, fn]) => [identifier, fn.bind(instance)]),
    mutationUpdates: mutationUpdates.map(([identifier, fn]) => [identifier, fn.bind(instance)]),
    optimisticResponses: optimisticResponses.map(([identifier, fn]) => [identifier, fn.bind(instance)]),
    refetchQueries: refetchQueries.map(([identifier, fn]) => [identifier, fn.bind(instance)]),
    resolvers: resolvers.map(([identifier, fn]) => [identifier, fn.bind(instance)])
  };
}
