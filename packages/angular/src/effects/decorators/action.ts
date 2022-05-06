import { ActionFn, ActionType } from '@apollo-orbit/core';
import { updateStateDefinition } from './internal';

export function Action<T = any>(action: ActionType<T>) {
  return function (target: any, name: string, _descriptor: TypedPropertyDescriptor<ActionFn<T>>): void {
    updateStateDefinition(
      target.constructor,
      descriptor => descriptor.action(action, function (this: any, ...args: Array<any>) {
        return this[name](...args);
      }));
  };
}
