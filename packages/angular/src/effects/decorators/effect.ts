import { EffectFn, MutationIdentifier } from '@apollo-orbit/core';
import { OperationVariables as Variables } from '@apollo/client/core';
import { updateStateDefinition } from './internal';

export function Effect<T = any, V = Variables>(mutation: MutationIdentifier<T, V>) {
  return function (target: any, name: string, _descriptor: TypedPropertyDescriptor<EffectFn<T, V>>): void {
    updateStateDefinition(
      target.constructor,
      descriptor => descriptor.effect(mutation, function (this: any, ...args: Array<any>) {
        return this[name](...args);
      }));
  };
}
