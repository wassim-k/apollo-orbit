import { MutationIdentifier, RefetchQueriesFn } from '@apollo-orbit/core';
import { OperationVariables as Variables } from '@apollo/client/core';
import { updateStateDefinition } from './internal';

export function RefetchQueries<T = any, V = Variables>(mutation: MutationIdentifier<T, V>) {
  return function (target: any, name: string, _descriptor: TypedPropertyDescriptor<RefetchQueriesFn<T, V>>): void {
    updateStateDefinition(
      target.constructor,
      descriptor => descriptor.refetchQueries(mutation, function (this: any, ...args: Array<any>) {
        return this[name](...args);
      }));
  };
}
