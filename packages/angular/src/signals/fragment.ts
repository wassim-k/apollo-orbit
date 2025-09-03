import { computed, effect, Injector, Signal, signal, WritableSignal } from '@angular/core';
import { DocumentNode, FragmentType, Reference, StoreObject, TypedDocumentNode, OperationVariables as Variables } from '@apollo/client';
import type { MissingTree } from '@apollo/client/cache';
import type { DeepPartial } from '@apollo/client/utilities';
import { equal } from '@wry/equality';
import { Subscription } from 'rxjs';
import { Apollo } from '../apollo';

export type SignalFragmentResult<TData> =
  | { data: TData; complete: true; missing?: never }
  | { data: DeepPartial<TData>; complete: false; missing?: MissingTree };

// import { ApolloCache.WatchFragmentOptions as SignalFragmentOptions } from '@apollo/client';
export interface SignalFragmentOptions<TData = unknown, TVariables extends Variables = Variables> {
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
          | StoreObject | Reference | FragmentType<NoInfer<TData>> | string
          | (() => StoreObject | Reference | FragmentType<NoInfer<TData>> | string);
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
  public readonly data: Signal<DeepPartial<TData>>;

  /**
   * `true` if all requested fields in the fragment are present in the cache, `false` otherwise.
   */
  public readonly complete: Signal<boolean>;

  /**
   * If `complete` is `false`, this field describes which fields are missing.
   */
  public readonly missing: Signal<MissingTree | undefined>;

  private readonly _result: WritableSignal<SignalFragmentResult<TData>>;
  private readonly from: Signal<StoreObject | Reference | string | null>;
  private readonly variables: Signal<TVariables | undefined>;
  private subscription: Subscription | undefined;

  public constructor(
    injector: Injector,
    private readonly apollo: Apollo,
    private readonly options: SignalFragmentOptions<TData, TVariables>
  ) {
    this._result = signal({
      data: {} as DeepPartial<TData>,
      complete: false
    });

    const { variables, from } = options;

    this.result = this._result.asReadonly();
    this.data = computed(() => this.result().data as DeepPartial<TData>);
    this.complete = computed(() => this.result().complete);
    this.missing = computed(() => this.result().missing);
    this.from = typeof from === 'function' ? computed(from, { equal }) : signal(from);
    this.variables = typeof variables === 'function' ? computed(variables, { equal }) : signal(variables);

    effect(onCleanup => {
      const from = this.from();
      const variables = this.variables();

      if (from !== null) {
        this.subscription = this.subscribe(from, variables);
      }

      onCleanup(() => {
        this.subscription?.unsubscribe();
        this.subscription = undefined;
      });
    }, { injector });
  }

  private subscribe(from: StoreObject | Reference | string, variables: TVariables | undefined): Subscription {
    return this.apollo.watchFragment({
      ...this.options,
      from,
      variables
    }).subscribe(result => this._result.set(result));
  }
}
