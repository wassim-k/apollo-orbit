import { Resolver, TypeField } from '@apollo-orbit/core';
import { Observable, lastValueFrom } from 'rxjs';
import { updateStateDefinition } from './internal';

export function Resolve(typeField: TypeField) {
  return function (target: any, name: string, _descriptor: TypedPropertyDescriptor<Resolver>): void {
    updateStateDefinition(
      target.constructor,
      descriptor => descriptor.resolver(typeField, transformResolver(function (this: any, ...args: Array<any>) {
        return this[name](...args);
      })));
  };
}

export function transformResolver(resolver: Resolver): Resolver {
  return function (this: any, ...args: Parameters<Resolver>) {
    const result = resolver.call(this, ...args);
    return result instanceof Observable
      ? lastValueFrom(result)
      : result;
  };
}
