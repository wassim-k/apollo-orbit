import { Injectable } from '@angular/core';
import { Apollo, ApolloClient, ErrorPolicy, MutationOptions, MutationResultForOptions, OperationVariables as Variables } from '@apollo-orbit/angular';
import { MutationManager } from '@apollo-orbit/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class ɵApollo extends Apollo {
  private readonly manager: MutationManager;

  public constructor(client: ApolloClient, manager: MutationManager) {
    super(client);
    this.manager = manager;
  }

  public override mutate<
    TData = unknown,
    TVariables extends Variables = Variables,
    TErrorPolicy extends ErrorPolicy | undefined = undefined
  >(options: MutationOptions<TData, TVariables, TErrorPolicy>): Observable<MutationResultForOptions<TData, TErrorPolicy>> {
    const { manager } = this;
    return super.mutate<TData, TVariables, TErrorPolicy>(manager.wrapMutationOptions(options) as MutationOptions<TData, TVariables, TErrorPolicy>).pipe(tap({
      next: result => manager.runEffects<TData, TVariables>(options, result, undefined),
      error: error => manager.runEffects<TData, TVariables>(options, undefined, error)
    }));
  }
}
