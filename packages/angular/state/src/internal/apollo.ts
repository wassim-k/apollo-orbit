import { Injectable } from '@angular/core';
import { Apollo, ApolloClient, DefaultOptions, MutationOptions, MutationResult, OperationVariables as Variables } from '@apollo-orbit/angular';
import { MutationManager } from '@apollo-orbit/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class ɵApollo extends Apollo {
  private readonly manager: MutationManager;

  public constructor(client: ApolloClient, manager: MutationManager, defaultOptions?: DefaultOptions) {
    super(client, defaultOptions);
    this.manager = manager;
  }

  public mutate<TData = unknown, TVariables extends Variables = Variables>(options: MutationOptions<TData, TVariables>): Observable<MutationResult<TData>> {
    const { manager } = this;
    return super.mutate<TData, TVariables>(manager.wrapMutationOptions(options)).pipe(tap({
      next: result => manager.runEffects<TData, TVariables>(options, result, undefined),
      error: error => manager.runEffects<TData, TVariables>(options, undefined, error)
    }));
  }
}
