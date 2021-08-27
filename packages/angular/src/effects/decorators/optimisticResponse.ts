import { MutationIdentifier, OptimisticResponseFn } from '@apollo-orbit/core';
import { OperationVariables as Variables } from '@apollo/client/core';
import { updateStateDefinition } from './internal';

export function OptimisticResponse<T = any, V = Variables, C = any>(mutation: MutationIdentifier<T, V>) {
  return function (target: any, name: string, _descriptor: TypedPropertyDescriptor<OptimisticResponseFn<T, V, C>>): void {
    updateStateDefinition(
      target.constructor,
      descriptor => descriptor.optimisticResponse(mutation, function (this: any, ...args: Array<any>) {
        return this[name](...args);
      }));
  };
}
