import { Injectable } from '@angular/core';
import { Apollo as ApolloBase, DefaultOptions, MutationResult } from '@apollo-orbit/angular/core';
import { Action, ActionInstance, MutationManager, resolveDispatchResults } from '@apollo-orbit/core';
import { ApolloClient, MutationOptions, OperationVariables as Variables } from '@apollo/client/core';
import { Observable, Subject, from } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ActionExecution } from './actions';

@Injectable()
export class Apollo<TCacheShape = any> extends ApolloBase<TCacheShape> {
  public readonly actions: Observable<ActionExecution>;

  private readonly manager: MutationManager;
  private readonly _actions: Subject<ActionExecution>;

  public constructor(client: ApolloClient<TCacheShape>, manager: MutationManager, defaultOptions?: DefaultOptions) {
    super(client, defaultOptions);
    this.manager = manager;
    this._actions = new Subject<ActionExecution>();
    this.actions = this._actions.asObservable();
  }

  public mutate<T = any, V extends Variables = Variables>(options: MutationOptions<T, V>): Observable<MutationResult<T>> {
    const { manager } = this;
    return super.mutate<T, V>(manager.wrapMutationOptions(options)).pipe(tap({
      next: result => manager.runEffects<T, V>(options, result, undefined),
      error: error => manager.runEffects<T, V>(options, undefined, error)
    }));
  }

  public dispatch<TAction extends Action | ActionInstance>(action: TAction): Observable<void> {
    this._actions.next({ action, status: 'dispatched' });
    return from(
      this.manager
        .dispatch({ cache: this.cache, dispatch: this.dispatch.bind(this) }, action)
        .then(results => {
          results.forEach(result => this._actions.next(result));
          return resolveDispatchResults(results);
        })
    );
  }
}
