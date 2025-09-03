import { computed, DestroyRef, effect, Injector, Signal, signal, untracked, WritableSignal } from '@angular/core';
import { DefaultContext, DocumentNode, ErrorLike, ErrorPolicy, FetchPolicy, TypedDocumentNode, OperationVariables as Variables } from '@apollo/client';
import { equal } from '@wry/equality';
import { Subscription } from 'rxjs';
import { Apollo } from '../apollo';
import { SubscriptionOptions, SubscriptionResult } from '../types';
import { SignalVariablesOption } from './types';

// import { ApolloClient.SubscribeOptions as SignalSubscriptionOptions } from  '@apollo/client';
export type SignalSubscriptionOptions<TData = unknown, TVariables extends Variables = Variables> = {
        /**
        * A GraphQL document, often created with `gql` from the `graphql-tag`
        * package, that contains a single subscription inside of it.
        */
        subscription: DocumentNode | TypedDocumentNode<TData, TVariables>;
        /**
        * How you want your component to interact with the Apollo cache. For details, see [Setting a fetch policy](https://www.apollographql.com/docs/react/data/queries/#setting-a-fetch-policy).
        */
        fetchPolicy?: FetchPolicy;
        /**
        * Specifies the `ErrorPolicy` to be used for this operation
        */
        errorPolicy?: ErrorPolicy;
        /**
        * Shared context between your component and your network interface (Apollo Link).
        */
        context?: DefaultContext;
        /**
        * Shared context between your component and your network interface (Apollo Link).
        */
        extensions?: Record<string, any>;

        /**
         * Whether to execute subscription immediately or lazily via `execute` method.
         */
        lazy?: boolean;

        /**
         * Callback for when new data is received
         */
        onData?: (data: TData) => void;

        /**
         * Callback for when the subscription is completed
         */
        onComplete?: () => void;

        /**
         * Callback for when an error occurs
         */
        onError?: (error: ErrorLike) => void;

        /**
         * Custom injector to use for this subscription.
         */
        injector?: Injector;
} & (
  | {
    /**
     * Whether to execute subscription immediately or lazily via `execute` method.
     */
    lazy: true;

    /**
    * A function or signal returning an object containing all of the GraphQL variables your operation requires to execute.
    *
    * Each key in the object corresponds to a variable name, and that key's value corresponds to the variable value.
    */
    variables?: () => TVariables | undefined;
  }
  | SignalVariablesOption<NoInfer<TVariables>>
);

export interface SignalSubscriptionExecOptions<TVariables extends Variables = Variables> {
  /**
   * Variables to use for this query execution.
   */
  variables?: TVariables;

  /**
   * Context to use for this execution.
   */
  context?: DefaultContext;
}

export interface SignalSubscriptionResult<TData> extends SubscriptionResult<TData> {
  /**
   * Whether the subscription is currently loading
   */
  loading: boolean;
}

export class SignalSubscription<TData, TVariables extends Variables = Variables> {
  /**
   * The subscription result, containing `data`, `loading`, and `error`.
   */
  public readonly result: Signal<SignalSubscriptionResult<TData>>;
  /**
   * If `true`, the subscription is currently loading the initial result.
   */
  public readonly loading: Signal<boolean>;
  /**
   * The data returned by the subscription, or `undefined` if loading, errored, or no data received yet.
   */
  public readonly data: Signal<TData | undefined>;
  /**
   * An error object if the subscription failed, `undefined` otherwise.
   */
  public readonly error: Signal<ErrorLike | undefined>;
  /**
   * If `true`, the subscription is currently active. `false` if terminated or if lazy and not yet executed.
   */
  public readonly active: Signal<boolean>;
  /**
   * The current variables being used by the subscription. Updates if the input `variables` option is reactive.
   */
  public readonly variables: Signal<TVariables | undefined>;

  private readonly _active: WritableSignal<boolean>;
  private readonly _result: WritableSignal<SignalSubscriptionResult<TData>>;
  private subscription: Subscription | undefined;

  public constructor(
    injector: Injector,
    private readonly apollo: Apollo,
    private readonly options: SignalSubscriptionOptions<TData, TVariables>
  ) {
    const { variables, lazy = false } = options;

    this._active = signal(!lazy);
    this.active = this._active.asReadonly();
    this._result = signal({ loading: !lazy, data: undefined, error: undefined });
    this.result = this._result.asReadonly();
    this.loading = computed(() => this.result().loading);
    this.data = computed(() => this.result().data);
    this.error = computed(() => this.result().error);
    this.variables = typeof variables === 'function' ? computed(variables, { equal }) : signal(variables);

    effect(() => {
      if (untracked(this.active)) {
        this.execute({ variables: this.variables() });
      }
    }, { injector });

    injector.get(DestroyRef).onDestroy(() => this.terminate());
  }

  /**
   * Execute subscription.
   */
  public execute(execOptions: SignalSubscriptionExecOptions<TVariables> = {}): void {
    this._active.set(true);

    const { subscription, onData, onError, onComplete, injector, lazy, ...options } = this.options;

    this.subscription?.unsubscribe();

    this._result.set({
      loading: true,
      data: undefined,
      error: undefined
    });

    this.subscription = this.apollo.subscribe<TData, TVariables>({
      ...options,
      ...execOptions,
      subscription,
      variables: 'variables' in execOptions ? execOptions.variables : untracked(this.variables)
    } as SubscriptionOptions<TData, TVariables>).subscribe({
      next: result => {
        this._result.set({
          loading: false,
          ...result
        });

        if (result.error) {
          onError?.(result.error);
        } else if (result.data !== undefined) {
          onData?.(result.data);
        }
      },
      error: error => {
        this._result.set({
          loading: false,
          data: undefined,
          error
        });

        onError?.(error);
      },
      complete: () => {
        this.terminate();
        onComplete?.();
      }
    });
  }

  /**
   * Terminate subscription.
   */
  public terminate(): void {
    this.subscription?.unsubscribe();
    this.subscription = undefined;
    this._active.set(false);
    this._result.update(result => ({ ...result, loading: false }));
  }
}
