import { computed, Signal, signal, untracked, WritableSignal } from '@angular/core';
import { DocumentNode, ErrorLike, ErrorPolicy, TypedDocumentNode, OperationVariables as Variables } from '@apollo/client';
import { mergeOptions, preventUnhandledRejection } from '@apollo/client/utilities/internal';
import { firstValueFrom } from 'rxjs';
import { Apollo } from '../apollo';
import type { EffectiveMutateErrorPolicy } from '../internal/errorPolicy';
import { MutationOptions, MutationResultForOptions } from '../types';

export interface SignalMutationResult<TData, TErrorPolicy extends ErrorPolicy | undefined = ErrorPolicy> {
  data: TData | undefined;
  error: EffectiveMutateErrorPolicy<TErrorPolicy> extends 'ignore' ? undefined : ErrorLike | undefined;
  loading: boolean;
  called: boolean;
}

/**
 * `errorPolicy` is absent by design: it types the result signals, so an execution overriding it could write an
 * error into an `error` signal narrowed to `undefined`.
 */
export type SignalMutationExecutionOptions<TData = unknown, TVariables extends Variables = Variables> =
  & Omit<MutationOptions<TData, TVariables>, 'mutation' | 'errorPolicy'>
  & {
    /**
     * A callback function that's called when your mutation successfully completes with zero errors (or if
     * `errorPolicy` is `ignore` and partial data is returned).
     *
     * This function is passed the mutation's result `data` and the options it was executed with.
     */
    onCompleted?: (data: TData, options?: MutationOptions<TData, TVariables>) => void;

    /**
     * A callback function that's called when the mutation encounters one or more errors (unless
     * `errorPolicy` is `ignore`).
     *
     * This function is passed the error and the options the mutation was executed with. It is a side effect
     * only: it does not stop the promise `mutate` returned from rejecting under an `errorPolicy` of `none`.
     */
    onError?: (error: ErrorLike, options?: MutationOptions<TData, TVariables>) => void;
  };

export type SignalMutationOptions<TData = unknown, TVariables extends Variables = Variables, TErrorPolicy extends ErrorPolicy | undefined = ErrorPolicy> =
  & Omit<SignalMutationExecutionOptions<TData, TVariables>, 'variables'>
  & {
    /**
     * Specifies how the mutation handles a response that returns both GraphQL errors and partial results.
     *
     * For details, see [GraphQL error policies](https://www.apollographql.com/docs/react/data/error-handling/#graphql-error-policies).
     *
     * The default value is `none`, meaning that the mutation result includes error details but _not_ partial results.
     *
     * Declared here because it types the result signals.
     */
    errorPolicy?: TErrorPolicy;
  };

const initialResult = <TData>(): SignalMutationResult<TData> => ({ data: undefined, error: undefined, called: false, loading: false });

export class SignalMutation<TData, TVariables extends Variables = Variables, TErrorPolicy extends ErrorPolicy | undefined = ErrorPolicy> {
  /**
   * The mutation result, containing `data`, `loading`, `error` and `called`.
   */
  public readonly result: Signal<SignalMutationResult<TData, TErrorPolicy>>;

  /**
   * If `true`, the mutation is currently in flight.
   */
  public readonly loading: Signal<boolean> = computed(() => this.result().loading);

  /**
   * The data returned from the mutation.
   */
  public readonly data: Signal<TData | undefined> = computed(() => this.result().data);

  /**
   * The error encountered during the mutation.
   */
  public readonly error = computed(() => this.result().error);

  /**
   * If `true`, the mutation's mutate method has been called.
   */
  public readonly called: Signal<boolean> = computed(() => this.result().called);

  private readonly _result: WritableSignal<SignalMutationResult<TData>>;
  private mutationId: number = 0;

  public constructor(
    private readonly apollo: Apollo,
    private readonly mutation: DocumentNode | TypedDocumentNode<TData, TVariables>,
    private readonly options?: SignalMutationOptions<TData, TVariables, TErrorPolicy>
  ) {
    this._result = signal(initialResult<TData>());
    this.result = this._result.asReadonly() as Signal<SignalMutationResult<TData, TErrorPolicy>>;
  }

  /**
   * Execute the mutation with the provided variables and options.
   */
  public mutate(...[executeOptions]: {} extends TVariables // eslint-disable-line @typescript-eslint/no-empty-object-type
    ? [executeOptions?: SignalMutationExecutionOptions<TData, TVariables>]
    : [executeOptions: SignalMutationExecutionOptions<TData, TVariables>]
  ): Promise<MutationResultForOptions<TData, TErrorPolicy>> {
    if (!untracked(this.loading)) {
      this._result.set({ ...initialResult<TData>(), called: true, loading: true });
    }

    const mutationId = ++this.mutationId;

    type ExecutionOptions = SignalMutationExecutionOptions<TData, TVariables>;

    const { mutation } = this;
    const { onCompleted, onError, ...mergedOptions } = mergeOptions<ExecutionOptions, ExecutionOptions>(
      this.options as Partial<ExecutionOptions> | undefined,
      (executeOptions ?? {})
    );
    const mutationOptions = { ...mergedOptions, mutation } as MutationOptions<TData, TVariables, TErrorPolicy>;

    const promise = firstValueFrom(this.apollo.mutate<TData, TVariables, TErrorPolicy>(mutationOptions))
      // Two callbacks rather than `.then(...).catch(...)`, so that a throwing `onCompleted` is not mistaken
      // for a failed mutation.
      .then(
        result => {
          const { data, error } = result;

          this.setResult(mutationId, { data, error, called: true, loading: false });

          if (error) {
            onError?.(error, mutationOptions);
          }

          if (!error && data !== undefined) {
            onCompleted?.(data, mutationOptions);
          }

          return result;
        },
        (error: ErrorLike) => {
          this.setResult(mutationId, { data: undefined, error, called: true, loading: false });

          onError?.(error, mutationOptions);

          throw error;
        }
      );

    // The signals record every error, so a fire-and-forget call must not raise `unhandledrejection`.
    return preventUnhandledRejection(promise);
  }

  /**
   * Reset the mutation result to its initial state.
   */
  public reset(): void {
    ++this.mutationId;
    this._result.set(initialResult<TData>());
  }

  /**
   * Only the newest execution owns the result signals; an earlier one that finishes later has been superseded.
   */
  private setResult(mutationId: number, result: SignalMutationResult<TData>): void {
    if (mutationId !== this.mutationId) return;

    this._result.set(result);
  }
}
