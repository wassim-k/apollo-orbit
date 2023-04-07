import { ApolloClientOptions, ApolloError, DefaultOptions as CoreDefaultOptions, QueryOptions as CoreQueryOptions, SubscribeToMoreOptions as CoreSubscribeToMoreOptions, WatchQueryOptions as CoreWatchQueryOptions, DocumentNode, NetworkStatus, TypedDocumentNode, OperationVariables as Variables } from '@apollo/client/core';

export interface ApolloOptions<TCacheShape = any> extends ApolloClientOptions<TCacheShape> {
  /**
   * Client identifier in a multi-client setup
   */
  id?: string;
  defaultOptions?: DefaultOptions;
}

export interface DefaultOptions extends CoreDefaultOptions {
  watchQuery?: Partial<WatchQueryOptions>;
  query?: Partial<QueryOptions>;
}

export interface WatchQueryOptions<V extends Variables = Variables, T = any> extends CoreWatchQueryOptions<V, T>, ExtraWatchQueryOptions { }
export interface QueryOptions<V extends Variables = Variables, T = any> extends CoreQueryOptions<V, T>, ExtraQueryOptions { }

export interface ExtraWatchQueryOptions {
  /**
   * Whether or not observers should receive initial network loading status when subscribing to this observable.
   * @default true
   */
  notifyOnLoading?: boolean;

  /**
   * Throw errors on the observable's error stream instead of assigning them to the error property of the result object.
   * @default false
   */
  throwError?: boolean;
}

export interface ExtraQueryOptions {
  /**
   * Whether or not observers should receive initial network loading status when subscribing to this observable.
   * @default false
   */
  notifyOnLoading?: boolean;

  /**
   * Throw errors on the observable's error stream instead of assigning them to the error property of the result object.
   * @default true
   */
  throwError?: boolean;
}

export interface SubscribeToMoreOptions<
  TData = any,
  TSubscriptionVariables = Variables,
  TSubscriptionData = TData
> extends Omit<CoreSubscribeToMoreOptions<TData, TSubscriptionVariables, TSubscriptionData>, 'document'> {
  query: DocumentNode | TypedDocumentNode<TSubscriptionData, TSubscriptionVariables>;
}

export interface Context extends Record<string, any> { }

export class PureQueryOptions<T = any, V = Variables, C = Context> {
  public constructor(
    public readonly query: TypedDocumentNode<T, V>,
    public readonly variables?: V,
    public readonly context?: C
  ) { }
}

export class PureMutationOptions<T = any, V = Variables, C = Context> {
  public constructor(
    public readonly mutation: TypedDocumentNode<T, V>,
    public readonly variables?: V,
    public readonly context?: C
  ) { }
}

export class PureSubscriptionOptions<T = any, V = Variables> {
  public constructor(
    public readonly query: TypedDocumentNode<T, V>,
    public readonly variables?: V
  ) { }
}

export interface QueryResult<T = any> {
  data?: T;
  error?: ApolloError;
  loading: boolean;
  networkStatus: NetworkStatus;
  partial?: boolean;
  previousData?: T;
}

export interface MutationResult<T = any, C = Context> {
  data?: T;
  error?: ApolloError;
  context?: C;
  extensions?: Record<string, any>;
}

export interface SubscriptionResult<T = any, C = Context> {
  data?: T;
  error?: ApolloError;
  context?: C;
  extensions?: Record<string, any>;
}
