import { computed, effect, Injector, Signal, signal, untracked, WritableSignal } from '@angular/core';
import { ApolloClient, DataValue, DocumentNode, TypedDocumentNode, OperationVariables as Variables } from '@apollo/client';
import type { ApolloCache, MissingTree } from '@apollo/client/cache';
import { equal } from '@wry/equality';
import { Subscription } from 'rxjs';
import { Apollo } from '../apollo';

export type SignalFragmentResult<TData> = ApolloCache.WatchFragmentResult<TData>;

/**
 * What a fragment can be watched from: an object, `null`, or an array of either.
 */
export type FragmentFrom<TData> = ApolloCache.WatchFragmentOptions<TData>['from'];

// import { ApolloCache.WatchFragmentOptions as SignalFragmentOptions } from '@apollo/client';
export interface SignalFragmentOptions<
  TData = unknown,
  TVariables extends Variables = Variables,
  TFrom extends FragmentFrom<TData> = FragmentFrom<TData>
> {
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
  * Any variables that the GraphQL fragment may depend on.
  *
  * @docGroup 2. Cache options
  */
  variables?: NoInfer<TVariables> | (() => NoInfer<TVariables>);
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
}

export class SignalFragment<TData, TVariables extends Variables = Variables> {
  /**
   * The fragment result, containing `data`, `complete`, and `missing`.
   */
  public readonly result: Signal<SignalFragmentResult<TData>>;

  /**
   * The data returned by the fragment.
   */
  public readonly data: Signal<DataValue.Partial<TData>>;

  /**
   * `true` if all requested fields in the fragment are present in the cache, `false` otherwise.
   */
  public readonly complete: Signal<boolean>;

  /**
   * If `complete` is `false`, this field describes which fields are missing.
   */
  public readonly missing: Signal<MissingTree | undefined>;

  private readonly _result: WritableSignal<SignalFragmentResult<TData>>;
  private readonly from: Signal<FragmentFrom<unknown>>;
  private readonly variables: Signal<TVariables | undefined>;
  private subscription: Subscription | undefined;

  public constructor(
    injector: Injector,
    private readonly apollo: Apollo,
    private readonly options: SignalFragmentOptions<any, TVariables, any>
  ) {
    const { variables, from } = options;

    this.from = typeof from === 'function' ? computed(from, { equal }) : signal(from);
    this.variables = typeof variables === 'function' ? computed(variables, { equal }) : signal(variables);

    this._result = signal<SignalFragmentResult<TData>>({
      data: emptyData(untracked(this.from)) as DataValue.Partial<TData>,
      complete: false,
      dataState: 'partial'
    } as SignalFragmentResult<TData>);

    this.result = this._result.asReadonly();
    this.data = computed(() => this.result().data);
    this.complete = computed(() => this.result().complete);
    this.missing = computed(() => this.result().missing);

    effect(onCleanup => {
      const from = this.from();
      const variables = this.variables();
      this.subscription = this.subscribe(from, variables);

      onCleanup(() => {
        this.subscription?.unsubscribe();
        this.subscription = undefined;
      });
    }, { injector });
  }

  private subscribe(from: FragmentFrom<unknown>, variables: TVariables | undefined): Subscription {
    return this.apollo.watchFragment({
      ...this.options,
      from,
      variables
    } as ApolloClient.WatchFragmentOptions<TData, TVariables>).subscribe(result => this._result.set(result as SignalFragmentResult<TData>));
  }
}

function emptyData(from: FragmentFrom<unknown>): unknown {
  if (Array.isArray(from)) return [];
  return from === null ? null : {};
}
