import { ActionFn as ActionFnCore, ActionType } from '@apollo-orbit/core';
import { Observable, lastValueFrom } from 'rxjs';
import { ActionContext, ActionFn } from '../types';
import { updateStateDefinition } from './internal';

export function Action<T = any>(action: ActionType<T> | string) {
  return function (target: any, name: string, _descriptor: TypedPropertyDescriptor<ActionFn<T>>): void {
    updateStateDefinition(
      target.constructor,
      descriptor => descriptor.action(action, transformActionFn(function (this: any, ...args: Array<any>) {
        return this[name](...args);
      })));
  };
}

export function transformActionFn(fn: ActionFn<any>): ActionFnCore<any> {
  return function (this: any, action, context) {
    const result = fn.call(this, action, context as unknown as ActionContext);
    return result instanceof Observable
      ? lastValueFrom(result)
      : result;
  };
}
