import { ApolloCache, ApolloError, FetchResult, MutationOptions, OperationVariables as Variables, QueryOptions, RefetchQueryDescriptor } from '@apollo/client/core';
import { ExecutionResult, GraphQLError } from 'graphql';
import { invokeActionFns, nameOfMutationDocument, ValuesByKey } from './internal';
import { StateDefinition } from './state';
import { Action, ActionContextInternal, ActionFn, ActionInstance, Context, DispatchResult, EffectFn, MutationInfo, MutationUpdateFn, OptimisticResponseFn, RefetchQueriesFn } from './types';
import { getActionType } from './utils/action';

export class MutationManager {
  private readonly mutationUpdates = new ValuesByKey<[string, MutationUpdateFn<any, any>]>(([mutation]) => mutation);
  private readonly actions = new ValuesByKey<[string, ActionFn<any>]>(([type]) => type);
  private readonly effects = new ValuesByKey<[string, EffectFn<any, any>]>(([mutation]) => mutation);
  private readonly refetchQueries = new ValuesByKey<[string, RefetchQueriesFn<any, any>]>(([mutation]) => mutation);
  private readonly optimisticResponses = new ValuesByKey<[string, OptimisticResponseFn<any, any>]>(([mutation]) => mutation);

  public constructor(
    private readonly apolloErrorFactory: (graphQLErrors: ReadonlyArray<GraphQLError>) => ApolloError
  ) { }

  public addState(definition: Pick<StateDefinition, 'mutationUpdates' | 'actions' | 'effects' | 'refetchQueries' | 'optimisticResponses'>): void {
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

  public runEffects<TData>(
    options: Pick<MutationOptions<any, any>, 'mutation' | 'variables' | 'context'>,
    result: FetchResult<TData> | undefined,
    error: ApolloError | undefined
  ): void {
    const { mutation } = options;
    const mutationName = nameOfMutationDocument(mutation);
    const effects = this.effects.get(mutationName);
    if (effects) {
      const mutationInfo = this.toMutationInfo(options, result, error);
      effects.forEach(([, fn]) => fn(mutationInfo));
    }
  }

  public wrapMutationOptions<T, V>(
    options: Pick<MutationOptions<T, V>, 'mutation' | 'variables' | 'optimisticResponse' | 'refetchQueries' | 'update' | 'context'>
  ): MutationOptions<T, V> {
    return {
      ...options,
      ...this.withMutationOptions(options)
    };
  }

  public withMutationOptions<T, V>(
    options: Pick<MutationOptions<T, V>, 'mutation' | 'variables' | 'optimisticResponse' | 'refetchQueries' | 'update' | 'context'>
  ): Pick<MutationOptions<T, V>, 'update' | 'refetchQueries' | 'optimisticResponse'> {
    const mutationName = nameOfMutationDocument(options.mutation);
    return {
      update: this.withUpdate<T, V>(mutationName, options),
      refetchQueries: this.withRefetchQueries<T, V>(mutationName, options),
      optimisticResponse: this.withOptimisticResponse<T, V>(mutationName, options)
    };
  }

  private withRefetchQueries<T, V>(
    mutationName: string,
    { refetchQueries, variables, context }: Pick<MutationOptions<T, V>, 'refetchQueries' | 'variables' | 'context'>
  ): MutationOptions<T, V>['refetchQueries'] {
    const refetchQueriesDefs = this.refetchQueries.get(mutationName);
    return refetchQueriesDefs === undefined
      ? refetchQueries
      : (result: ExecutionResult<T>): Array<RefetchQueryDescriptor | QueryOptions> | 'all' | 'active' => {
        const mutationInfo = this.toMutationInfo({ variables, context }, result);
        return refetchQueriesDefs.reduce<Array<RefetchQueryDescriptor | QueryOptions> | 'all' | 'active'>(
          (prev, [, fn]) => [...prev, ...fn(mutationInfo)],
          typeof refetchQueries === 'function'
            ? refetchQueries(result)
            : refetchQueries ?? []
        );
      };
  }

  private withUpdate<T, V>(
    mutationName: string,
    { update, variables, context }: Pick<MutationOptions<T, V>, 'update' | 'variables' | 'context'>
  ): MutationOptions<T, V>['update'] {
    const mutationUpdates = this.mutationUpdates.get(mutationName);
    return mutationUpdates === undefined
      ? update
      : (cache: ApolloCache<any>, result: FetchResult<T>, options: any) => {
        const mutationInfo = this.toMutationInfo({ variables, context }, result);
        mutationUpdates.forEach(([, fn]) => fn(cache, mutationInfo));
        update?.(cache, result, options);
      };
  }

  private withOptimisticResponse<T, V>(
    mutationName: string,
    { optimisticResponse, context }: Pick<MutationOptions<T, V>, 'optimisticResponse' | 'context'>
  ): MutationOptions<T, V>['optimisticResponse'] {
    const optimisticResponses = this.optimisticResponses.get(mutationName);
    return optimisticResponse !== undefined || optimisticResponses === undefined
      ? optimisticResponse
      : (vars: V): T => {
        const [, fn] = optimisticResponses[optimisticResponses.length - 1];
        return fn(vars, context);
      };
  }

  private toMutationInfo<T, V = Variables, C = Context>(
    options: Pick<MutationOptions<T, V>, 'variables' | 'context'>,
    fetchResult: FetchResult<T> = {},
    apolloError?: ApolloError
  ): MutationInfo<T, V, C> {
    const { variables, context: optionsContext } = options;
    const { data, errors, extensions } = fetchResult;
    const resultContext = 'context' in fetchResult ? fetchResult.context : {};
    return {
      data: data as T | undefined,
      error: errors && errors.length > 0 ? this.apolloErrorFactory(errors) : apolloError,
      context: resultContext || optionsContext ? { ...resultContext, ...optionsContext } as C : undefined,
      variables,
      extensions
    };
  }
}
