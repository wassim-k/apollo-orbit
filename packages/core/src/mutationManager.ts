import { ApolloCache, ApolloError, FetchResult, MutationOptions, QueryOptions, RefetchQueryDescriptor } from '@apollo/client/core';
import { ExecutionResult } from 'graphql';
import { nameOfMutationDocument, toMutationInfo, ValuesByKey } from './internal';
import { StateDefinition } from './state';
import { EffectFn, MutationUpdateFn, OptimisticResponseFn, RefetchQueriesFn } from './types';

export class MutationManager {
  private readonly mutationUpdates: ValuesByKey<[string, MutationUpdateFn<any, any>]> = new ValuesByKey(([mutation]) => mutation);
  private readonly effects: ValuesByKey<[string, EffectFn<any, any>]> = new ValuesByKey(([mutation]) => mutation);
  private readonly refetchQueries: ValuesByKey<[string, RefetchQueriesFn<any, any>]> = new ValuesByKey(([mutation]) => mutation);
  private readonly optimisticResponses: ValuesByKey<[string, OptimisticResponseFn<any, any>]> = new ValuesByKey(([mutation]) => mutation);

  public addState(definition: Pick<StateDefinition, 'mutationUpdates' | 'effects' | 'refetchQueries' | 'optimisticResponses'>): void {
    this.mutationUpdates.add(...definition.mutationUpdates);
    this.refetchQueries.add(...definition.refetchQueries);
    this.optimisticResponses.add(...definition.optimisticResponses);
    this.effects.add(...definition.effects);
  }

  public runEffects(
    options: Pick<MutationOptions<any, any>, 'mutation' | 'variables' | 'context'>,
    result: FetchResult | undefined,
    error: ApolloError | undefined
  ): void {
    const { mutation } = options;
    const mutationName = nameOfMutationDocument(mutation);
    const effects = this.effects.get(mutationName);
    if (effects) {
      const mutationInfo = toMutationInfo(options, result, error);
      effects.forEach(([, fn]) => fn(mutationInfo));
    }
  }

  public wrapMutationOptions<T, V>(
    options: Pick<MutationOptions<T, V>, 'mutation' | 'variables' | 'optimisticResponse' | 'refetchQueries' | 'update' | 'context'>
  ): MutationOptions<T, V> {
    const mutationName = nameOfMutationDocument(options.mutation);
    return {
      ...options,
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
        const mutationInfo = toMutationInfo({ variables, context }, result);
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
        const mutationInfo = toMutationInfo({ variables, context }, result);
        mutationUpdates.forEach(([, fn]) => fn(cache, mutationInfo));
        update?.(cache, result, options);
      };
  }

  private withOptimisticResponse<T, V>(
    mutationName: string,
    { optimisticResponse, context }: Pick<MutationOptions<T, V>, 'optimisticResponse' | 'context'>
  ): MutationOptions<T, V>['optimisticResponse'] {
    const optimisticResponses = this.optimisticResponses.get(mutationName);
    return optimisticResponse || optimisticResponses === undefined
      ? optimisticResponse
      : (vars: V): T => {
        const [, fn] = optimisticResponses[optimisticResponses.length - 1];
        return fn(vars, context);
      };
  }
}
