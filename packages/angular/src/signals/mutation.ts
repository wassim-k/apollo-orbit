import { computed, Signal, signal, untracked, WritableSignal } from '@angular/core';
import { ApolloClient, DocumentNode, ErrorLike, TypedDocumentNode, OperationVariables as Variables } from '@apollo/client';
import { mergeOptions } from '@apollo/client/utilities/internal';
import { Apollo } from '../apollo';
import { MutationOptions, MutationResult } from '../types';

export interface SignalMutationResult<TData> extends MutationResult<TData> {
  loading: boolean;
  called: boolean;
}

export type SignalMutationOptions<TData = unknown, TVariables extends Variables = Variables> = Omit<SignalMutationExecutionOptions<TData, TVariables>, 'variables'>;

export type SignalMutationExecutionOptions<TData = unknown, TVariables extends Variables = Variables> =
  & Omit<MutationOptions<TData, TVariables>, 'mutation'>
  & {
    /**
     * Callback executed when the mutation completes successfully.
     */
    onData?: (data: TData, options?: MutationOptions<TData, TVariables>) => void;

    /**
     * Callback executed when the mutation encounters an error.
     */
    onError?: (error: ErrorLike, options?: MutationOptions<TData, TVariables>) => void;
  };

export class SignalMutation<TData, TVariables extends Variables = Variables> {
  /**
   * The mutation result, containing `data`, `loading`, and `error` and `called`.
   */
  public readonly result: Signal<SignalMutationResult<TData>>;

  /**
   * If `true`, the mutation is currently in flight.
   */
  public readonly loading: Signal<boolean>;

  /**
   * The data returned from the mutation.
   */
  public readonly data: Signal<TData | undefined>;

  /**
   * The error encountered during the mutation.
   */
  public readonly error: Signal<ErrorLike | undefined>;

  /**
   * If `true`, the mutation's mutate method has been called.
   */
  public readonly called: Signal<boolean>;

  private readonly _result: WritableSignal<SignalMutationResult<TData>>;
  private mutationId: number;

  public constructor(
    private readonly apollo: Apollo,
    private readonly mutation: DocumentNode | TypedDocumentNode<TData, TVariables>,
    private readonly options?: SignalMutationOptions<TData, TVariables>
  ) {
    this._result = signal({
      data: undefined,
      called: false,
      loading: false
    });

    this.mutationId = 0;

    this._result = signal({ data: undefined, called: false, loading: false });
    this.result = this._result.asReadonly();
    this.loading = computed(() => this.result().loading);
    this.data = computed(() => this.result().data);
    this.error = computed(() => this.result().error);
    this.called = computed(() => this.result().called);
  }

  /**
   * Execute the mutation with the provided variables and options.
   */
  public mutate(...[executeOptions]: {} extends TVariables // eslint-disable-line @typescript-eslint/no-empty-object-type
    ? [executeOptions?: SignalMutationExecutionOptions<TData, TVariables>]
    : [executeOptions: SignalMutationExecutionOptions<TData, TVariables>]
  ): Promise<MutationResult<TData>> {
    if (!untracked(this.loading)) {
      this._result.set({
        loading: true,
        error: undefined,
        data: undefined,
        called: true
      });
    }

    // Increment the mutation ID to track concurrent mutations
    const mutationId = ++this.mutationId;

    const { mutation } = this;
    const { onData, onError, errorPolicy = 'all', ...mergedOptions } = mergeOptions(this.options ?? {}, executeOptions ?? {});
    const mutationOptions = { ...mergedOptions, mutation, errorPolicy } as ApolloClient.MutateOptions<TData, TVariables>;

    return new Promise<MutationResult<TData>>((resolve, reject) => {
      this.apollo.mutate<TData, TVariables>(mutationOptions).subscribe({
        next: result => {
          const { data, error } = result;

          if (error) {
            onError?.(error, mutationOptions);
          }

          if (!error && data !== undefined) {
            onData?.(data, mutationOptions);
          }

          // Only update signal if this is still the current mutation
          if (mutationId === this.mutationId) {
            const newResult = {
              called: true,
              loading: false,
              data,
              error
            };

            this._result.set(newResult);
          }

          resolve(result);
        },
        error: error => {
          onError?.(error, mutationOptions);

          // Only update signal if this is still the current mutation
          if (mutationId === this.mutationId) {
            const newResult = {
              called: true,
              loading: false,
              data: void 0,
              error
            };

            this._result.set(newResult);
          }

          reject(error);
        },
        complete: () => resolve(this.result())
      });
    });
  }

  /**
   * Reset the mutation result to its initial state.
   */
  public reset(): void {
    this.mutationId = 0;
    this._result.set({
      data: undefined,
      called: false,
      loading: false
    });
  }
}
