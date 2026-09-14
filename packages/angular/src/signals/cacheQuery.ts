import { computed, effect, Injector, linkedSignal, Signal, untracked, WritableSignal } from '@angular/core';
import { MissingFieldError, OperationVariables as Variables } from '@apollo/client';
import { equal } from '@wry/equality';
import { ApolloCacheEx, CacheQueryData, CacheQueryOptions, CacheQueryResult } from '../cacheEx';
import { IncompleteCacheError } from '../cacheQueryObservable';
import type { SignalCacheVariablesOption } from './types';

export type SignalCacheQueryOptions<
  TData = unknown,
  TVariables extends Variables = Variables,
  TPartial extends boolean = boolean
> = Omit<CacheQueryOptions<TData, TVariables, TPartial>, 'variables' | 'immediate'> & {
  /**
   * Custom injector to use for this signal.
   */
  injector?: Injector;
} & SignalCacheVariablesOption<NoInfer<TVariables>>;

export class SignalCacheQuery<
  TData,
  TVariables extends Variables = Variables,
  TPartial extends boolean = false,
  TRequired extends boolean = false
> {
  /**
   * The cache query result, containing `data`, `complete`, and `missing`.
   * Narrow on `complete` to reach fully typed `data`.
   */
  public readonly result: Signal<CacheQueryResult<TData, TPartial, TRequired>>;

  /**
   * The data the cache holds for the query, or `null` if the cache does not hold all of it. With
   * `returnPartialData`, an incomplete read carries the fields the cache did have. A `required` query
   * throws instead of reporting either.
   */
  public readonly data: Signal<CacheQueryData<TData, TPartial, TRequired>> = computed(() => this.result().data);

  /**
   * `true` if all requested fields are present in the cache, `false` otherwise.
   */
  public readonly complete = computed(() => this.result().complete as TRequired extends true ? true : boolean);

  /**
   * If `complete` is `false`, this field describes which fields are missing.
   */
  public readonly missing = computed(() => this.result().missing as TRequired extends true ? undefined : MissingFieldError | undefined);

  /**
   * The variables the query is currently reading the cache with.
   */
  public readonly variables: Signal<TVariables | undefined>;

  private readonly _result: WritableSignal<CacheQueryResult<TData, TPartial>>;

  public constructor(
    injector: Injector,
    cache: ApolloCacheEx,
    options: SignalCacheQueryOptions<TData, TVariables, TPartial>,
    ...[required]: [TRequired] extends [false] ? [required?: TRequired] : [required: TRequired]
  ) {
    const { variables: variablesOption, injector: _injector, ...cacheOptions } = options;

    this.variables = computed(() => variablesOption?.(), { equal });

    const observable = computed(() => cache.watchQuery<TData, TVariables, TPartial>({
      ...cacheOptions,
      variables: this.variables()
    }));

    this._result = linkedSignal({
      source: observable,
      computation: observable => observable.getCurrentResult()
    });

    this.result = computed(() => {
      const result = this._result();

      if (required && !result.complete) throw new IncompleteCacheError(result.missing);

      return result as CacheQueryResult<TData, TPartial, TRequired>;
    });

    effect(onCleanup => {
      const _observable = observable();
      const subscription = _observable.subscribe(result => {
        if (untracked(observable) === _observable) this._result.set(result);
      });

      onCleanup(() => subscription.unsubscribe());
    }, { injector });
  }
}
