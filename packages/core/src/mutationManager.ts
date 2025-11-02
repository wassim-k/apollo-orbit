import { ApolloCache, ApolloClient, ApolloLink, CombinedGraphQLErrors, DefaultContext, ErrorLike, InternalRefetchQueriesInclude, NormalizedExecutionResult, Unmasked, OperationVariables as Variables } from '@apollo/client';
import type { IgnoreModifier } from '@apollo/client/cache';
import { FormattedExecutionResult } from 'graphql';
import { Notifier, ValuesByKey, invokeActionFn, nameOfMutationDocument } from './internal';
import { State } from './state';
import { Action, ActionContext, ActionFn, ActionInstance, DispatchResult, EffectFn, MutationInfo, MutationUpdateFn, OptimisticResponseFn, RefetchQueriesFn } from './types';
import { getActionType } from './utils/action';

export class MutationManager {
  private readonly mutationUpdates = new ValuesByKey<[string, MutationUpdateFn<any, any, any>]>(([mutation]) => mutation);
  private readonly actions = new ValuesByKey<[string, ActionFn<any>]>(([type]) => type);
  private readonly effects = new ValuesByKey<[string, EffectFn<any, any>]>(([mutation]) => mutation);
  private readonly refetchQueries = new ValuesByKey<[string, RefetchQueriesFn<any, any>]>(([mutation]) => mutation);
  private readonly optimisticResponses = new ValuesByKey<[string, OptimisticResponseFn<any, any>]>(([mutation]) => mutation);
  private readonly notifier = new Notifier();

  public addState(definition: Pick<State, 'mutationUpdates' | 'actions' | 'effects' | 'refetchQueries' | 'optimisticResponses'>): void {
    this.mutationUpdates.add(...definition.mutationUpdates);
    this.refetchQueries.add(...definition.refetchQueries);
    this.optimisticResponses.add(...definition.optimisticResponses);
    this.effects.add(...definition.effects);
    this.actions.add(...definition.actions);
  }

  public dispatch<TAction extends Action | ActionInstance>(action: TAction, context: ActionContext): Promise<Array<DispatchResult>> {
    const actionFns = this.actions.get(getActionType(action))?.map(([, fn]) => [fn, action] as const) ?? [];
    return Promise.all(actionFns.map(actionFn => invokeActionFn(actionFn, context)))
      .then(results => this.notifier.defer(results)); // Let apollo client's deferred watchers notification execute first.
  }

  public runEffects<TData, TVariables extends Variables = DefaultContext>(
    options: ApolloClient.MutateOptions<TData, TVariables>,
    result: ApolloClient.MutateResult<TData> | undefined,
    error: ErrorLike | undefined
  ): void {
    const { mutation, variables, context } = options;
    const mutationName = nameOfMutationDocument(mutation);
    const effects = this.effects.get(mutationName);
    if (effects) {
      const mutationInfo = this.toMutationInfo<TData, TVariables>({ variables, context }, result, error);
      effects.forEach(([, fn]) => fn(mutationInfo));
    }
  }

  public wrapMutationOptions<TData, TVariables extends Variables = DefaultContext>(
    options: ApolloClient.MutateOptions<TData, TVariables>
  ): ApolloClient.MutateOptions<TData, TVariables> {
    return { ...options, ...this.withMutationOptions(options) } as ApolloClient.MutateOptions<TData, TVariables>;
  }

  public withMutationOptions<TData, TVariables extends Variables, TCache extends ApolloCache>(
    options: ApolloClient.MutateOptions<TData, TVariables, TCache>
  ): Pick<ApolloClient.MutateOptions<TData, TVariables, TCache>, 'update' | 'refetchQueries' | 'optimisticResponse'> {
    const mutationName = nameOfMutationDocument(options.mutation);
    return {
      update: this.withUpdate<TData, TVariables, TCache>(mutationName, options),
      refetchQueries: this.withRefetchQueries<TData, TVariables, TCache>(mutationName, options),
      optimisticResponse: this.withOptimisticResponse<TData, TVariables, TCache>(mutationName, options)
    };
  }

  private withRefetchQueries<TData, TVariables extends Variables, TCache extends ApolloCache>(
    mutationName: string,
    { refetchQueries, variables, context }: ApolloClient.MutateOptions<TData, TVariables, TCache>
  ): ApolloClient.MutateOptions<TData, TVariables>['refetchQueries'] {
    const refetchQueriesDefs = this.refetchQueries.get(mutationName);
    return (
      refetchQueriesDefs === undefined
        ? refetchQueries
        : (result: NormalizedExecutionResult<Unmasked<TData>>): InternalRefetchQueriesInclude => {
          const mutationInfo = this.toMutationInfo({ variables, context }, result);
          return refetchQueriesDefs.reduce<InternalRefetchQueriesInclude>(
            (prev, [, fn]) => [...prev, ...fn(mutationInfo)],
            typeof refetchQueries === 'function'
              ? refetchQueries(result)
              : refetchQueries ?? []
          );
        }
    ) as ApolloClient.MutateOptions<TData, TVariables>['refetchQueries'];
  }

  private withUpdate<TData, TVariables extends Variables, TCache extends ApolloCache>(
    mutationName: string,
    { update }: ApolloClient.MutateOptions<TData, TVariables, TCache>
  ): ApolloClient.MutateOptions<TData, TVariables, TCache>['update'] {
    const mutationUpdates = this.mutationUpdates.get(mutationName);
    return (
      mutationUpdates === undefined
        ? update
        : (cache: TCache, result: FormattedExecutionResult<Unmasked<TData>>, options: {
          context?: DefaultContext;
          variables?: TVariables;
        }): void => {
          const mutationInfo = this.toMutationInfo<TData, TVariables>(options, result);
          mutationUpdates.forEach(([, fn]) => fn(cache, mutationInfo));
          update?.(cache, result, options);
        }
    ) as ApolloClient.MutateOptions<TData, TVariables, TCache>['update'];
  }

  private withOptimisticResponse<TData, TVariables extends Variables, TCache extends ApolloCache>(
    mutationName: string,
    { optimisticResponse, context }: ApolloClient.MutateOptions<TData, TVariables, TCache>
  ): ApolloClient.MutateOptions<TData, TVariables>['optimisticResponse'] {
    const optimisticResponses = this.optimisticResponses.get(mutationName);
    return (
      optimisticResponse !== undefined || optimisticResponses === undefined
        ? optimisticResponse
        : (vars: TVariables, { IGNORE }: { IGNORE: IgnoreModifier }): Unmasked<NoInfer<TData>> => {
          const [, fn] = optimisticResponses[optimisticResponses.length - 1];
          return fn(vars, { IGNORE, context });
        }
    ) as ApolloClient.MutateOptions<TData, TVariables>['optimisticResponse'];
  }

  private toMutationInfo<TData, TVariables extends Variables = DefaultContext>(
    options: { variables?: TVariables; context?: DefaultContext },
    result: ApolloClient.MutateResult<TData> | ApolloLink.Result<Unmasked<TData>> = {},
    error?: ErrorLike
  ): MutationInfo<TData, TVariables> {
    const { variables, context } = options;
    const { data, extensions } = result;
    return {
      data: data as TData | undefined,
      error: 'errors' in result && result.errors && result.errors.length > 0 ? new CombinedGraphQLErrors({ errors: result.errors }) : error,
      context,
      variables,
      extensions
    };
  }
}
