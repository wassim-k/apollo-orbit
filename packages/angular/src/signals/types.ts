import { OperationVariables as Variables } from '@apollo/client';

export type SignalVariablesOption<TVariables extends Variables> = {} extends TVariables ? { // eslint-disable-line @typescript-eslint/no-empty-object-type
  /**
  * A function or signal returning an object containing all of the GraphQL variables your operation requires to execute.
  *
  * Each key in the object corresponds to a variable name, and that key's value corresponds to the variable value.
  */
  variables?: () => TVariables | undefined;
} : {
  /**
  * A function or signal returning an object containing all of the GraphQL variables your operation requires to execute.
  *
  * Each key in the object corresponds to a variable name, and that key's value corresponds to the variable value.
  */
  variables: () => TVariables;
};
