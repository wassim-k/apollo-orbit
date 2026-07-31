import { OperationVariables as Variables } from '@apollo/client';

export type SignalVariablesOption<TVariables extends Variables> = {} extends TVariables ? { // eslint-disable-line @typescript-eslint/no-empty-object-type
  /**
  * A function or signal returning an object containing all of the GraphQL variables your operation requires to execute.
  *
  * Each key in the object corresponds to a variable name, and that key's value corresponds to the variable value.
  *
  * When `null` is returned, the operation will be terminated until a non-null value is returned again.
  */
  variables?: () => TVariables | undefined | null;
} : {
  /**
  * A function or signal returning an object containing all of the GraphQL variables your operation requires to execute.
  *
  * Each key in the object corresponds to a variable name, and that key's value corresponds to the variable value.
  *
  * When `null` is returned, the operation will be terminated until a non-null value is returned again.
  */
  variables: () => TVariables | null;
};

/**
 * Variables option for an operation that can be lazy.
 *
 * When `lazy` is `true`, variables are always optional, even when the operation requires them, because
 * they can be provided later via `execute`.
 */
export type SignalLazyVariablesOption<TVariables extends Variables> =
  | {
    /**
     * Whether to execute the operation immediately or lazily via `execute` method.
     */
    lazy: true;

    /**
    * A function or signal returning an object containing all of the GraphQL variables your operation requires to execute.
    *
    * Each key in the object corresponds to a variable name, and that key's value corresponds to the variable value.
    *
    * When `null` is returned, the operation will be terminated until a non-null value is returned again.
    */
    variables?: () => TVariables | undefined | null;
  }
  | SignalVariablesOption<TVariables>;
