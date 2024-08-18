import { ApolloCache, ApolloError, FetchResult, InternalRefetchQueriesInclude, MutationOptions, OperationVariables as Variables } from '@apollo/client/core';
import { GraphQLFormattedError } from 'graphql';
import { ValuesByKey, invokeActionFns, nameOfMutationDocument } from './internal';
import { State } from './state';
import { Action, ActionContextInternal, ActionFn, ActionInstance, Context, DispatchResult, EffectFn, MutationInfo, MutationUpdateFn, OptimisticResponseFn, RefetchQueriesFn } from './types';
import { getActionType } from './utils/action';

export class MutationManager {
  private readonly mutationUpdates = new ValuesByKey<[string, MutationUpdateFn<any, any, any, any>]>(([mutation]) => mutation);
  private readonly actions = new ValuesByKey<[string, ActionFn<any>]>(([type]) => type);
  private readonly effects = new ValuesByKey<[string, EffectFn<any, any, any>]>(([mutation]) => mutation);
  private readonly refetchQueries = new ValuesByKey<[string, RefetchQueriesFn<any, any, any>]>(([mutation]) => mutation);
  private readonly optimisticResponses = new ValuesByKey<[string, OptimisticResponseFn<any, any, any>]>(([mutation]) => mutation);

  public constructor(
    private readonly apolloErrorFactory: (graphQLErrors: ReadonlyArray<GraphQLFormattedError>) => ApolloError
  ) { }

  public addState(definition: Pick<State, 'mutationUpdates' | 'actions' | 'effects' | 'refetchQueries' | 'optimisticResponses'>): void {
    this.mutationUpdates.add(...definition.mutationUpdates);
    this.refetchQueries.add(...definition.refetchQueries);
    this.optimisticResponses.add(...definition.optimisticResponses);
    this.effects.add(...definition.effects);
    this.actions.add(...definition.actions);
  }

  public dispatch<TAction extends Action | ActionInstance>(context: ActionContextInternal, action: TAction): Promise<Array<DispatchResult>> {
    const actionFn = this.actions.get(getActionType(action))?.map(([, fn]) => [fn, action] as const) ?? [];
    return invokeActionFns(actionFn, context)
      // let apollo client's deferred watchers notification execute first.
      .then(results => new Promise(resolve => setTimeout(() => resolve(results), 0)));
  }

  public runEffects<TData, TVariables, TContext = Context>(
    options: Pick<MutationOptions<TData, TVariables, TContext>, 'mutation' | 'variables' | 'context'>,
    result: FetchResult<TData> | undefined,
    error: ApolloError | undefined
  ): void {
    const { mutation } = options;
    const mutationName = nameOfMutationDocument(mutation);
    const effects = this.effects.get(mutationName);
    if (effects) {
      const mutationInfo = this.toMutationInfo<TData, TVariables, TContext>(options, result, error);
      effects.forEach(([, fn]) => fn(mutationInfo));
    }
  }

  public wrapMutationOptions<TData, TVariables, TContext = Context>(
    options: Pick<MutationOptions<TData, TVariables, TContext>, 'mutation' | 'variables' | 'optimisticResponse' | 'refetchQueries' | 'update' | 'context'>
  ): MutationOptions<TData, TVariables, TContext> {
    return {
      ...options,
      ...this.withMutationOptions(options)
    };
  }

  public withMutationOptions<TData, TVariables, TContext, TCache extends ApolloCache<any>>(
    options: Pick<MutationOptions<TData, TVariables, TContext, TCache>, 'mutation' | 'variables' | 'optimisticResponse' | 'refetchQueries' | 'update' | 'context'>
  ): Pick<MutationOptions<TData, TVariables, TContext, TCache>, 'update' | 'refetchQueries' | 'optimisticResponse'> {
    const mutationName = nameOfMutationDocument(options.mutation);
    return {
      update: this.withUpdate<TData, TVariables, TContext, TCache>(mutationName, options),
      refetchQueries: this.withRefetchQueries<TData, TVariables, TContext, TCache>(mutationName, options),
      optimisticResponse: this.withOptimisticResponse<TData, TVariables, TContext, TCache>(mutationName, options)
    };
  }

  private withRefetchQueries<TData, TVariables, TContext, TCache extends ApolloCache<any>>(
    mutationName: string,
    { refetchQueries, variables, context }: Pick<MutationOptions<TData, TVariables, TContext, TCache>, 'refetchQueries' | 'variables' | 'context'>
  ): MutationOptions<TData, TVariables>['refetchQueries'] {
    const refetchQueriesDefs = this.refetchQueries.get(mutationName);
    return refetchQueriesDefs === undefined
      ? refetchQueries
      : (result: FetchResult<TData>): InternalRefetchQueriesInclude => {
        const mutationInfo = this.toMutationInfo({ variables, context }, result);
        return refetchQueriesDefs.reduce<InternalRefetchQueriesInclude>(
          (prev, [, fn]) => [...prev, ...fn(mutationInfo)],
          typeof refetchQueries === 'function'
            ? refetchQueries(result)
            : refetchQueries ?? []
        );
      };
  }

  private withUpdate<TData, TVariables, TContext, TCache extends ApolloCache<any>>(
    mutationName: string,
    { update, variables, context }: Pick<MutationOptions<TData, TVariables, TContext, TCache>, 'update' | 'variables' | 'context'>
  ): MutationOptions<TData, TVariables, TContext, TCache>['update'] {
    const mutationUpdates = this.mutationUpdates.get(mutationName);
    return mutationUpdates === undefined
      ? update
      : (cache: TCache, result: FetchResult<TData>, options: any) => {
        const mutationInfo = this.toMutationInfo<TData, TVariables, TContext>({ variables, context }, result);
        mutationUpdates.forEach(([, fn]) => fn(cache, mutationInfo));
        update?.(cache, result, options);
      };
  }

  private withOptimisticResponse<TData, TVariables, TContext, TCache extends ApolloCache<any>>(
    mutationName: string,
    { optimisticResponse, context }: Pick<MutationOptions<TData, TVariables, TContext, TCache>, 'optimisticResponse' | 'context'>
  ): MutationOptions<TData, TVariables>['optimisticResponse'] {
    const optimisticResponses = this.optimisticResponses.get(mutationName);
    return optimisticResponse !== undefined || optimisticResponses === undefined
      ? optimisticResponse
      : (vars: TVariables): TData => {
        const [, fn] = optimisticResponses[optimisticResponses.length - 1];
        return fn(vars, context);
      };
  }

  private toMutationInfo<TData, TVariables = Variables, TContext = Context>(
    options: Pick<MutationOptions<TData, TVariables, TContext>, 'variables' | 'context'>,
    fetchResult: FetchResult<TData> = {},
    apolloError?: ApolloError
  ): MutationInfo<TData, TVariables, TContext> {
    const { variables, context: optionsContext } = options;
    const { data, errors, extensions } = fetchResult;
    const resultContext = 'context' in fetchResult ? fetchResult.context : {};
    return {
      data: data as TData | undefined,
      error: errors && errors.length > 0 ? this.apolloErrorFactory(errors) : apolloError,
      context: typeof resultContext !== 'undefined' || typeof optionsContext !== 'undefined' ? { ...resultContext, ...optionsContext } as TContext : undefined,
      variables,
      extensions
    };
  }
}
