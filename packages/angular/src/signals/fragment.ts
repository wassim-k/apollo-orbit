import { computed, effect, Injector, linkedSignal, Signal, untracked, WritableSignal } from '@angular/core';
import { ApolloClient, DocumentNode, TypedDocumentNode, OperationVariables as Variables } from '@apollo/client';
import type { ApolloCache, MissingTree } from '@apollo/client/cache';
import { equal } from '@wry/equality';
import type { SignalCacheVariablesOption } from './types';
import { Apollo } from '../apollo';

export type SignalFragmentResult<TData> = ApolloClient.WatchFragmentResult<TData>;

/**
 * What a fragment can be watched from: an object, `null`, or an array of either.
 */
export type FragmentFrom<TData> = ApolloCache.WatchFragmentOptions<TData>['from'];

// import { ApolloCache.WatchFragmentOptions as SignalFragmentOptions } from '@apollo/client';
export type SignalFragmentOptions<
  TData = unknown,
  TVariables extends Variables = Variables,
  TFrom extends FragmentFrom<TData> = FragmentFrom<TData>
> = {
  /**
  * A GraphQL fragment document parsed into an AST with the `gql`
  * template literal.
  *
  * @docGroup 1. Required options
  */
  fragment: DocumentNode | TypedDocumentNode<TData, TVariables>;
  /**
  * An object containing a `__typename` and primary key fields
  * (such as `id`) identifying the entity object from which the fragment will
  * be retrieved, or a `{ __ref: "..." }` reference, or a `string` ID
  * (uncommon).
  *
  * @docGroup 1. Required options
  */
  from:
  | TFrom
  | (() => TFrom);
  /**
  * The name of the fragment defined in the fragment document.
  *
  * Required if the fragment document includes more than one fragment,
  * optional otherwise.
  *
  * @docGroup 2. Cache options
  */
  fragmentName?: string;
  /**
  * If `true`, `watchFragment` returns optimistic results.
  *
  * The default value is `true`.
  *
  * @docGroup 2. Cache options
  */
  optimistic?: boolean;

  /**
   * Custom injector to use for this signal.
   */
  injector?: Injector;
} & SignalCacheVariablesOption<NoInfer<TVariables>>;

export class SignalFragment<TData, TVariables extends Variables = Variables> {
  /**
   * The fragment result, containing `data`, `complete`, and `missing`.
   */
  public readonly result: Signal<SignalFragmentResult<TData>>;

  /**
   * The data the cache holds for the fragment. Narrow `result` on `complete` to reach fully typed data.
   */
  public readonly data: Signal<SignalFragmentResult<TData>['data']> = computed(() => this.result().data);

  /**
   * `true` if all requested fields in the fragment are present in the cache, `false` otherwise.
   */
  public readonly complete: Signal<boolean> = computed(() => this.result().complete);

  /**
   * If `complete` is `false`, this field describes which fields are missing.
   */
  public readonly missing: Signal<MissingTree | undefined> = computed(() => this.result().missing);

  /**
   * The variables the fragment is currently reading the cache with.
   */
  public readonly variables: Signal<TVariables | undefined>;

  private readonly _result: WritableSignal<SignalFragmentResult<TData>>;

  public constructor(
    injector: Injector,
    apollo: Apollo,
    options: SignalFragmentOptions<any, TVariables, any>
  ) {
    const { variables: variablesOption, from: fromOption, injector: _injector, ...fragmentOptions } = options;

    const from = computed(() => typeof fromOption === 'function' ? fromOption() : fromOption, { equal });

    this.variables = computed(() => variablesOption?.(), { equal });

    const observable = computed(() => apollo.watchFragment({
      ...fragmentOptions,
      from: from(),
      variables: this.variables()
    } as ApolloClient.WatchFragmentOptions<TData, TVariables>) as ApolloClient.ObservableFragment<TData>);

    this._result = linkedSignal({
      source: observable,
      computation: observable => observable.getCurrentResult()
    });

    this.result = this._result.asReadonly();

    effect(onCleanup => {
      const _observable = observable();
      const subscription = _observable.subscribe(result => {
        if (untracked(observable) === _observable) this._result.set(result);
      });

      onCleanup(() => subscription.unsubscribe());
    }, { injector });
  }
}
