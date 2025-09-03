import { lastValueFrom, Observable } from 'rxjs';
import { ActionContext, ActionFn, DispatchResult } from '../types';

export function invokeActionFn([fn, action]: readonly [ActionFn<any>, any], context: ActionContext): Promise<DispatchResult> {
  try {
    const value = fn(action, context);

    if (value instanceof Promise) {
      return value
        .then<DispatchResult>(() => ({ action, status: 'success' }))
        .catch<DispatchResult>(error => ({ action, error, status: 'error' }));
    } else if (value instanceof Observable) {
      return lastValueFrom(value, { defaultValue: void 0 })
        .then<DispatchResult>(() => ({ action, status: 'success' }))
        .catch<DispatchResult>(error => ({ action, error, status: 'error' }));
    } else {
      return Promise.resolve<DispatchResult>({ action, status: 'success' });
    }
  } catch (error) {
    return Promise.resolve<DispatchResult>({ action, error, status: 'error' });
  }
}
