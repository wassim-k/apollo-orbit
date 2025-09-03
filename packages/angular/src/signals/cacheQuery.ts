import { computed, effect, Injector, Signal, signal, WritableSignal } from '@angular/core';
import { DocumentNode, MissingFieldError, TypedDocumentNode, OperationVariables as Variables } from '@apollo/client';
import { equal } from '@wry/equality';
import { Subscription } from 'rxjs';
import { ApolloCacheEx, CacheWatchQueryCompleteResult, CacheWatchQueryPartialResult } from '../cacheEx';

export interface SignalCacheQueryOptions<
  TData = unknown,
  TVariables extends Variables = Variables
> {
  /**
   * A GraphQL query document parsed into an AST by gql.
   */
  query: DocumentNode | TypedDocumentNode<TData, TVariables>;

  /**
   * An object containing all of the variables your query needs to execute.
   * Can be provided as a static object, a signal, or a function that returns the variables.
   * When provided as a function, it will be executed in a computed context and will
   * automatically re-execute the query when any reactive dependencies change.
   */
  variables?: NoInfer<TVariables> | (() => NoInfer<TVariables>);

  /**
   * If `true`, the query will be evaluated against both the optimistic cache layer
   * and the normal cache layer. This allows optimistic updates to be reflected
   * in the query results immediately.
   * @default true
   */
  optimistic?: boolean;

  immediate?: boolean;

  /**
   * If set to `true`, the observable will emit the partial data that is available in the cache.
   * If set to `false`, the observable will throw an error if the complete data is not available in the cache.
   * @default false
   */
  returnPartialData?: boolean;

  /**
   * Custom injector to use for this signal.
   */
  injector?: Injector;
}

type SignalCacheQueryResult<TData> = TData extends undefined
  ? CacheWatchQueryPartialResult<TData>
  : CacheWatchQueryCompleteResult<TData>;

export class SignalCacheQuery<TData, TVariables extends Variables = Variables> {
  /**
   * The cache query result, containing `data`, `complete`, and `missing`.
   */
  public readonly result: Signal<SignalCacheQueryResult<TData>>;

  /**
   * The data returned by the cache query.
   */
  public readonly data: Signal<TData>;

  /**
   * A signal indicating whether the query result contains complete data.
   * - `true`: All requested fields are available in the cache
   * - `false`: Some fields are missing from the cache
   * - `undefined`: Query has not been executed yet
   */
  public readonly complete: Signal<boolean | undefined>;

  /**
   * A signal containing an array of missing field errors if the query is incomplete.
   * Will be `undefined` if the query is complete or has not been executed.
   */
  public readonly missing: Signal<Array<MissingFieldError> | undefined>;

  private readonly _result: WritableSignal<SignalCacheQueryResult<TData>>;
  private readonly variables: Signal<TVariables | undefined>;
  private subscription: Subscription | undefined;

  public constructor(
    injector: Injector,
    private readonly cache: ApolloCacheEx,
    private readonly options: SignalCacheQueryOptions<TData, TVariables>
  ) {
    this._result = signal<SignalCacheQueryResult<TData>>({
      data: undefined,
      complete: false
    } as SignalCacheQueryResult<TData>);

    const { variables } = options;
    this.result = this._result.asReadonly();
    this.data = computed(() => this.result().data as TData);
    this.complete = computed(() => this.result().complete);
    this.missing = computed(() => this.result().missing);
    this.variables = typeof variables === 'function' ? computed(variables, { equal }) : signal(variables);

    effect(onCleanup => {
      this.subscription = this.subscribe(this.variables());

      onCleanup(() => {
        this.subscription?.unsubscribe();
        this.subscription = undefined;
      });
    }, { injector });
  }

  private subscribe(variables: TVariables | undefined): Subscription {
    return this.cache
      .watchQuery({ ...this.options, variables })
      .subscribe(result => this._result.set(result as SignalCacheQueryResult<TData>));
  }
}
