import { Apollo as ApolloBase, DefaultOptions, MutationResult } from '@apollo-orbit/angular/core';
import { MutationManager } from '@apollo-orbit/core';
import { ApolloClient, MutationOptions, OperationVariables as Variables } from '@apollo/client/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

export class Apollo<TCacheShape = any> extends ApolloBase<TCacheShape> {
    private readonly manager: MutationManager;

    public constructor(client: ApolloClient<TCacheShape>, manager: MutationManager, defaultOptions?: DefaultOptions) {
        super(client, defaultOptions);
        this.manager = manager;
    }

    public mutate<T = any, V = Variables>(options: MutationOptions<T, V>): Observable<MutationResult<T>> {
        const { manager } = this;
        return super.mutate<T, V>(manager.wrapMutationOptions(options)).pipe(tap({
            next: result => manager.runEffects(options, result, undefined),
            error: error => manager.runEffects(options, undefined, error)
        }));
    }

    public dispatch<T>(action: T): Promise<void> {
        return this.manager.dispatch(this.cache, action);
    }
}
