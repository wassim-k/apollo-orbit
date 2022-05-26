import { ActionType, getActionType } from '@apollo-orbit/core';
import { filter, map, OperatorFunction } from 'rxjs';

export type ActionStatus = 'dispatched' | 'success' | 'error';

export interface ActionExecution<TAction = any, TError = Error> {
    status: ActionStatus;
    action: TAction;
    error?: TError;
}

export interface ActionComplete<TAction = any, TError = Error> {
    action: TAction;
    error?: TError;
    status: Extract<ActionStatus, 'success' | 'error'>;
}

export function ofActionDispatched<TActionTypes extends Array<ActionType<any>>>(
    ...actions: TActionTypes
): OperatorFunction<
    ActionExecution<InstanceType<TActionTypes[number]>>,
    InstanceType<TActionTypes[number]>
> {
    const actionMap = createActionMap(actions);
    return source => source.pipe(
        filter(ctx => ctx.status === 'dispatched' && actionMap[getActionType(ctx.action)]),
        map(({ action }) => action)
    );
}

export function ofActionSuccess<TActionTypes extends Array<ActionType<any>>>(
    ...actions: TActionTypes
): OperatorFunction<
    ActionExecution<InstanceType<TActionTypes[number]>>,
    InstanceType<TActionTypes[number]>
> {
    const actionMap = createActionMap(actions);
    return source => source.pipe(
        filter(ctx => ctx.status === 'success' && actionMap[getActionType(ctx.action)]),
        map(({ action }) => action)
    );
}

export function ofActionError<TActionTypes extends Array<ActionType<any>>>(
    ...actions: TActionTypes
): OperatorFunction<
    ActionExecution<InstanceType<TActionTypes[number]>>,
    InstanceType<TActionTypes[number]>
> {
    const actionMap = createActionMap(actions);
    return source => source.pipe(
        filter(ctx => ctx.status === 'error' && actionMap[getActionType(ctx.action)]),
        map(({ action }) => action)
    );
}

export function ofActionComplete<TActionTypes extends Array<ActionType<any>>>(
    ...actions: TActionTypes
): OperatorFunction<
    ActionExecution<InstanceType<TActionTypes[number]>>,
    ActionComplete<InstanceType<TActionTypes[number]>>
> {
    const actionMap = createActionMap(actions);
    const statuses: Array<ActionStatus> = ['success', 'error'];
    return source => source.pipe(
        filter((ctx): ctx is ActionComplete => statuses.includes(ctx.status) && actionMap[getActionType(ctx.action)])
    );
}

function createActionMap(actions: Array<ActionType<any>>): { [type: string]: boolean } {
    return actions.reduce<{ [type: string]: boolean }>((acc, action) => ({ ...acc, [action.type]: true }), {});
}
