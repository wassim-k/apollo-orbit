import { Resolver, TypeField } from '@apollo-orbit/core';
import { updateStateDefinition } from './internal';

export function Resolve(typeField: TypeField) {
  return function (target: any, name: string, _descriptor: TypedPropertyDescriptor<Resolver>): void {
    updateStateDefinition(
      target.constructor,
      descriptor => descriptor.resolver(typeField, function (this: any, ...args: Array<any>) {
        return this[name](...args);
      }));
  };
}
