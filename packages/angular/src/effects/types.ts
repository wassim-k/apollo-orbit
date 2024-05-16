import { Action, ActionInstance, State } from '@apollo-orbit/core';
import { ApolloCache } from '@apollo/client/core';
import { Observable } from 'rxjs';

export type StateFactory = () => State;

export type ActionFn<T> = (action: T, context: ActionContext) => void | Promise<any> | Observable<any>;

export interface ActionContext<TCacheShape = any> {
  cache: ApolloCache<TCacheShape>;
  dispatch<TAction extends Action | ActionInstance>(action: TAction): Observable<void>;
}
