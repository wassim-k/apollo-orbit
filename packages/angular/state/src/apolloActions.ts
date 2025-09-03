import { inject, Injectable } from '@angular/core';
import { ɵApolloRegistry as ApolloRegistry } from '@apollo-orbit/angular';
import { Action, ActionInstance, flatten, resolveDispatchResults } from '@apollo-orbit/core';
import { Observable, Subject } from 'rxjs';
import { ActionExecution } from './actions';
import { ɵApollo } from './internal/apollo';

@Injectable()
export class ApolloActions extends Observable<ActionExecution> {
  private readonly registry = inject(ApolloRegistry);

  private readonly actions = new Subject<ActionExecution>();

  public constructor() {
    super(subscriber => this.actions.subscribe(subscriber));
  }

  public dispatch<TAction extends Action | ActionInstance>(action: TAction): Promise<void> {
    this.actions.next({ action, status: 'dispatched' });
    return Promise.all((this.registry.instances as Array<ɵApollo>)
      .map(apollo => apollo['manager'].dispatch(action, { cache: apollo.client.cache, dispatch: this.dispatch.bind(this) }))) // eslint-disable-line dot-notation
      .then(flatten)
      .then(results => {
        for (const result of results) {
          this.actions.next(result);
        }
        return resolveDispatchResults(results);
      });
  }
}
