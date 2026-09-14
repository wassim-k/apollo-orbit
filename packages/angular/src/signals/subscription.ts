import { computed, DestroyRef, effect, Injector, linkedSignal, Signal, signal, untracked, WritableSignal } from '@angular/core';
import { DefaultContext, DocumentNode, ErrorLike, ErrorPolicy, FetchPolicy, TypedDocumentNode, OperationVariables as Variables } from '@apollo/client';
import { equal } from '@wry/equality';
import { Subscription } from 'rxjs';
import { Apollo } from '../apollo';
import { SubscriptionOptions, SubscriptionResult } from '../types';
import { SignalLazyVariablesOption } from './types';

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
} & SignalLazyVariablesOption<NoInfer<TVariables>>;

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

interface Execution<TVariables extends Variables> {
  readonly variables: TVariables | undefined;
  readonly subscription: Subscription | undefined;
}

export class SignalSubscription<TData, TVariables extends Variables = Variables> {
  /**
   * The subscription result, containing `data`, `loading`, and `error`.
   */
  public readonly result: Signal<SignalSubscriptionResult<TData>>;

  /**
   * If `true`, the subscription is currently loading the initial result.
   */
  public readonly loading: Signal<boolean> = computed(() => this.result().loading);

  /**
   * The data returned by the subscription, or `undefined` if loading, errored, or no data received yet.
   */
  public readonly data: Signal<TData | undefined> = computed(() => this.result().data);

  /**
   * An error object if the subscription failed, `undefined` otherwise.
   */
  public readonly error: Signal<ErrorLike | undefined> = computed(() => this.result().error);

  /**
   * A writable signal that represents the current subscription variables.
   */
  public readonly variables: WritableSignal<TVariables | undefined | null>;

  /**
   * Whether the subscription is currently active, connected to the server and receiving real-time updates.
   */
  public readonly active: Signal<boolean> = computed(() => this.execution()?.subscription !== undefined);

  /**
   * Whether the subscription is currently enabled.
   *
   * This property starts as `true` for non-lazy subscriptions and `false` for lazy subscriptions.
   *
   * Calling `execute()` sets it to `true`, while calling `terminate()` sets it to `false`.
   *
   * When `true`:
   * - The subscription automatically starts when variables change from `null` to a non-null value
   * - Variable changes trigger re-subscription with the new variables
   *
   * When `false`:
   * - Variable changes are ignored and do not trigger re-subscription
   * - The subscription must be manually started via `execute()`
   *
   * Note: This is different from `active`, which indicates whether the subscription is currently connected to the server and receiving real-time updates.
   */
  public readonly enabled: Signal<boolean>;

  private readonly execution: WritableSignal<Execution<TVariables> | undefined> = signal(undefined);
  private readonly _result: WritableSignal<SignalSubscriptionResult<TData>> = linkedSignal({
    source: computed(() => this.enabled() && this.variables() !== null),
    computation: (executable, previous) => ({
      loading: executable,
      data: previous?.value.data,
      error: previous?.value.error
    })
  });

  private readonly _enabled: WritableSignal<boolean>;

  public constructor(
    injector: Injector,
    private readonly apollo: Apollo,
    private readonly options: SignalSubscriptionOptions<TData, TVariables>
  ) {
    const { variables, lazy = false } = options;

    this._enabled = signal(!lazy);
    this.enabled = this._enabled.asReadonly();

    this.variables = linkedSignal(() => variables?.(), { equal });

    this.result = this._result.asReadonly();

    effect(() => {
      const variables = this.variables();
      const execution = untracked(this.execution);

      if (!untracked(this.enabled)) return;
      if (execution !== undefined && execution.variables === variables) return;

      if (variables === null) this._terminate();
      else this._execute({ variables });
    }, { injector });

    injector.get(DestroyRef).onDestroy(() => this.terminate());
  }

  /**
   * Execute subscription.
   */
  public execute(execOptions: SignalSubscriptionExecOptions<TVariables> = {}): void {
    this._enabled.set(true);
    this._execute(execOptions);
  }

  /**
   * Terminate subscription.
   */
  public terminate(): void {
    this._enabled.set(false);
    this._terminate();
  }

  private _execute(execOptions: SignalSubscriptionExecOptions<TVariables> = {}): void {
    if ('variables' in execOptions) {
      this.variables.set(execOptions.variables);
    }

    const variables = untracked(this.variables);

    if (variables === null) {
      return;
    }

    this._result.set({
      loading: true,
      data: undefined,
      error: undefined
    });

    const { subscription: document, onData, onError, onComplete, injector, lazy, ...options } = this.options;
    const previous = untracked(this.execution);
    let execution: Execution<TVariables> = { variables, subscription: undefined };
    this.execution.set(execution);
    previous?.subscription?.unsubscribe();

    const subscription = this.apollo.subscribe<TData, TVariables>({
      ...options,
      ...execOptions,
      subscription: document,
      variables
    } as SubscriptionOptions<TData, TVariables>).subscribe({
      next: result => {
        if (untracked(this.execution) !== execution) return;

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
      complete: () => {
        if (untracked(this.execution) !== execution) return;

        this.execution.set({ variables, subscription: undefined });
        this._result.update(result => ({ ...result, loading: false }));
        onComplete?.();
      }
    });

    if (untracked(this.execution) === execution) {
      execution = { variables, subscription };
      this.execution.set(execution);
    } else {
      subscription.unsubscribe();
    }
  }

  private _terminate(): void {
    const execution = untracked(this.execution);

    if (execution === undefined) return;

    this.execution.set(undefined);
    this._result.update(result => ({ ...result, loading: false }));
    execution.subscription?.unsubscribe();
  }
}
