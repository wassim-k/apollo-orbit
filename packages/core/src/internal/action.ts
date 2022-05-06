import { ActionContext, ActionFn, DispatchResult } from '../types';

export function invokeActionFns(actionFns: ReadonlyArray<readonly [ActionFn<any>, any]>, context: ActionContext): Promise<Array<DispatchResult>> {
    return Promise.all(actionFns.map(actionFn => invokeActionFn(actionFn, context)));
}

function invokeActionFn([fn, action]: readonly [ActionFn<any>, any], context: ActionContext): Promise<DispatchResult> {
    try {
        const value = fn(action, context);
        return value instanceof Promise
            ? value.then<DispatchResult>(() => ({ action, status: 'success' })).catch<DispatchResult>(error => ({ action, error, status: 'error' }))
            : Promise.resolve<DispatchResult>({ action, status: 'success' });
    } catch (error) {
        return Promise.resolve<DispatchResult>({ action, error, status: 'error' });
    }
}
