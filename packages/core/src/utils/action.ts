import { Action, ActionInstance, DispatchResult } from '../types';

export function getActionType<TAction extends Action | ActionInstance>(action: TAction): string {
    const type = (action as any)?.constructor?.type ?? (action as any)?.type;
    if (typeof type !== 'string') throw new Error('Failed to determine type of action');
    return type;
}

export function resolveDispatchResults(results: Array<DispatchResult>): Promise<void> {
    const errorResults = results.filter(result => result.status === 'error');
    return errorResults.length > 0
        ? Promise.reject(errorResults[0].error instanceof Error ? errorResults[0].error : new Error(errorResults[0].error))
        : Promise.resolve();
}
