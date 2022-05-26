import { ApolloCache } from '@apollo/client/core';
import { Observable } from 'rxjs';

export interface OnInitState {
  /**
   * This method is invoked after the application's root component has been bootstrapped.
   *
   * If the root component has already been bootstrapped, then it's invoked immediately.
   */
  onInit(): void;
}

export interface ActionContext<TCacheShape = any> {
  cache: ApolloCache<TCacheShape>;
  dispatch<TActions extends Array<any>>(...action: TActions): Observable<void>;
}

export type ActionFn<T> = (action: T, context: ActionContext) => any | Promise<any> | Observable<any>;
