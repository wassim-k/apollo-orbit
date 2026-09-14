import { OperationVariables as Variables } from '@apollo/client';

export type SignalVariablesOption<TVariables extends Variables> = {} extends TVariables ? { // eslint-disable-line @typescript-eslint/no-empty-object-type
  /**
  * The operation's variables, as a function or signal re-read whenever its reactive dependencies change.
  *
  * Returning `null` terminates the operation until it returns a non-null value again.
  */
  variables?: () => TVariables | undefined | null;
} : {
  /**
  * The operation's variables, as a function or signal re-read whenever its reactive dependencies change.
  *
  * Returning `null` terminates the operation until it returns a non-null value again.
  */
  variables: () => TVariables | null;
};

export type SignalCacheVariablesOption<TVariables extends Variables> = {} extends TVariables ? { // eslint-disable-line @typescript-eslint/no-empty-object-type
  /**
  * The operation's variables, as a function or signal re-read whenever its reactive dependencies change.
  */
  variables?: () => TVariables | undefined;
} : {
  /**
  * The operation's variables, as a function or signal re-read whenever its reactive dependencies change.
  */
  variables: () => TVariables;
};

/**
 * Variables option for an operation that can be lazy, where they are always optional because `execute` can
 * supply them later.
 */
export type SignalLazyVariablesOption<TVariables extends Variables> =
  | {
    /**
     * Whether to execute the operation immediately or lazily via `execute` method.
     */
    lazy: true;

    /**
    * The operation's variables, as a function or signal re-read whenever its reactive dependencies change.
    *
    * Returning `null` terminates the operation until it returns a non-null value again.
    */
    variables?: () => TVariables | undefined | null;
  }
  | SignalVariablesOption<TVariables>;
