/* eslint-disable max-len */

import type { ApolloCache, ApolloClient, DataState, DefaultContext, DocumentNode, ErrorLike, ErrorPolicy, FetchPolicy, GetDataState, InternalRefetchQueriesInclude, MutationFetchPolicy, MutationQueryReducersMap, MutationUpdaterFunction, NetworkStatus, NormalizedExecutionResult, OnQueryUpdated, RefetchWritePolicy, SubscribeToMoreUpdateQueryFn, TypedDocumentNode, Unmasked, OperationVariables as Variables, WatchQueryFetchPolicy } from '@apollo/client';
import type { IgnoreModifier } from '@apollo/client/cache';
import type { VariablesOption } from '@apollo/client/utilities/internal';

export interface ApolloOptions extends ApolloClient.Options {
  /**
   * Client identifier in a multi-client setup
   */
  id?: string;
  defaultOptions?: DefaultOptions;
}

export interface DefaultOptions {
  watchQuery?: Partial<WatchQueryOptions<any, any>>;
  query?: Partial<QueryOptions<any, any>>;
  mutate?: Partial<MutationOptions<any, any, any>>;
}

// import { ApolloClient.WatchQueryOptions } from '@apollo/client';
export type WatchQueryOptions<TData = unknown, TVariables extends Variables = Variables> = {
        /**
        * Specifies how the query interacts with the Apollo Client cache during execution (for example, whether it checks the cache for results before sending a request to the server).
        *
        * For details, see [Setting a fetch policy](https://www.apollographql.com/docs/react/data/queries/#setting-a-fetch-policy).
        *
        * The default value is `cache-first`.
        *
        * @docGroup 3. Caching options
        */
        fetchPolicy?: WatchQueryFetchPolicy;
        /**
        * Specifies the `FetchPolicy` to be used after this query has completed.
        *
        * @docGroup 3. Caching options
        */
        nextFetchPolicy?: ApolloClient.WatchQueryOptions<TData, TVariables>['nextFetchPolicy'];
        /**
        * Defaults to the initial value of options.fetchPolicy, but can be explicitly
        * configured to specify the WatchQueryFetchPolicy to revert back to whenever
        * variables change (unless nextFetchPolicy intervenes).
        *
        * @docGroup 3. Caching options
        */
        initialFetchPolicy?: WatchQueryFetchPolicy;
        /**
        * Specifies whether a `NetworkStatus.refetch` operation should merge
        * incoming field data with existing data, or overwrite the existing data.
        * Overwriting is probably preferable, but merging is currently the default
        * behavior, for backwards compatibility with Apollo Client 3.x.
        *
        * @docGroup 3. Caching options
        */
        refetchWritePolicy?: RefetchWritePolicy;
        /**
        * Specifies how the query handles a response that returns both GraphQL errors and partial results.
        *
        * For details, see [GraphQL error policies](https://www.apollographql.com/docs/react/data/error-handling/#graphql-error-policies).
        *
        * The default value is `none`, meaning that the query result includes error details but not partial results.
        *
        * @docGroup 1. Operation options
        */
        errorPolicy?: ErrorPolicy;
        /**
        * If you're using [Apollo Link](https://www.apollographql.com/docs/react/api/link/introduction/), this object is the initial value of the `context` object that's passed along your link chain.
        *
        * @docGroup 2. Networking options
        */
        context?: DefaultContext;
        /**
        * Specifies the interval (in milliseconds) at which the query polls for updated results.
        *
        * The default value is `0` (no polling).
        *
        * @docGroup 2. Networking options
        */
        pollInterval?: number;
        /**
        * If `true`, the in-progress query's associated component re-renders whenever the network status changes or a network error occurs.
        *
        * The default value is `true`.
        *
        * @docGroup 2. Networking options
        */
        notifyOnNetworkStatusChange?: boolean;
        /**
        * If `true`, the query can return partial results from the cache if the cache doesn't contain results for all queried fields.
        *
        * The default value is `false`.
        *
        * @docGroup 3. Caching options
        */
        returnPartialData?: boolean;
        /**
        * A callback function that's called whenever a refetch attempt occurs
        * while polling. If the function returns `true`, the refetch is
        * skipped and not reattempted until the next poll interval.
        *
        * @docGroup 2. Networking options
        */
        skipPollAttempt?: () => boolean;
        /**
        * A GraphQL query string parsed into an AST with the gql template literal.
        *
        * @docGroup 1. Operation options
        */
        query: DocumentNode | TypedDocumentNode<TData, TVariables>;

        /**
         * Whether or not observers should receive initial network loading status when subscribing to this observable.
         * @default true
         */
        notifyOnLoading?: boolean;
} & VariablesOption<NoInfer<TVariables>>;

// import { ApolloClient.QueryOptions } from '@apollo/client';
export type QueryOptions<TData = unknown, TVariables extends Variables = Variables> = {
        /**
        * A GraphQL query string parsed into an AST with the gql template literal.
        *
        * @docGroup 1. Operation options
        */
        query: DocumentNode | TypedDocumentNode<TData, TVariables>;
        /**
        * Specifies how the query handles a response that returns both GraphQL errors and partial results.
        *
        * For details, see [GraphQL error policies](https://www.apollographql.com/docs/react/data/error-handling/#graphql-error-policies).
        *
        * The default value is `none`, meaning that the query result includes error details but not partial results.
        *
        * @docGroup 1. Operation options
        */
        errorPolicy?: ErrorPolicy;
        /**
        * If you're using [Apollo Link](https://www.apollographql.com/docs/react/api/link/introduction/), this object is the initial value of the `context` object that's passed along your link chain.
        *
        * @docGroup 2. Networking options
        */
        context?: DefaultContext;
        /**
        * Specifies how the query interacts with the Apollo Client cache during execution (for example, whether it checks the cache for results before sending a request to the server).
        *
        * For details, see [Setting a fetch policy](https://www.apollographql.com/docs/react/data/queries/#setting-a-fetch-policy).
        *
        * The default value is `cache-first`.
        *
        * @docGroup 3. Caching options
        */
        fetchPolicy?: FetchPolicy;

        /**
         * Whether or not observers should receive initial network loading status when subscribing to this observable.
         * @default true
         */
        notifyOnLoading?: boolean;

        /**
         * Throw errors on the observable's error stream instead of assigning them to the error property of the result object.
         * @default true
         */
        throwError?: boolean;
} & VariablesOption<NoInfer<TVariables>>;

// import { ApolloClient.SubscribeOptions as SubscriptionOptions } from '@apollo/client';
export type SubscriptionOptions<TData = unknown, TVariables extends Variables = Variables> = {
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
    } & VariablesOption<NoInfer<TVariables>>;

// import { ApolloClient.MutateOptions as MutationOptions } from '@apollo/client';
export type MutationOptions<TData = unknown, TVariables extends Variables = Variables, TCache extends ApolloCache = ApolloCache> = {
        /**
        * By providing either an object or a callback function that, when invoked after
        * a mutation, allows you to return optimistic data and optionally skip updates
        * via the `IGNORE` sentinel object, Apollo Client caches this temporary
        * (and potentially incorrect) response until the mutation completes, enabling
        * more responsive UI updates.
        *
        * For more information, see [Optimistic mutation results](https://www.apollographql.com/docs/react/performance/optimistic-ui/).
        *
        * @docGroup 3. Caching options
        */
        optimisticResponse?: Unmasked<NoInfer<TData>> | ((vars: TVariables, { IGNORE }: {
            IGNORE: IgnoreModifier;
        }) => Unmasked<NoInfer<TData>> | IgnoreModifier);
        /**
        * A `MutationQueryReducersMap`, which is map from query names to
        * mutation query reducers. Briefly, this map defines how to incorporate the
        * results of the mutation into the results of queries that are currently
        * being watched by your application.
        */
        updateQueries?: MutationQueryReducersMap<TData>;
        /**
        * An array (or a function that _returns_ an array) that specifies which queries you want to refetch after the mutation occurs.
        *
        * Each array value can be either:
        *
        * - An object containing the `query` to execute, along with any `variables`
        *
        * - A string indicating the operation name of the query to refetch
        *
        * @docGroup 1. Operation options
        */
        refetchQueries?: ((result: NormalizedExecutionResult<Unmasked<TData>>) => InternalRefetchQueriesInclude) | InternalRefetchQueriesInclude;
        /**
        * If `true`, makes sure all queries included in `refetchQueries` are completed before the mutation is considered complete.
        *
        * The default value is `false` (queries are refetched asynchronously).
        *
        * @docGroup 1. Operation options
        */
        awaitRefetchQueries?: boolean;
        /**
        * A function used to update the Apollo Client cache after the mutation completes.
        *
        * For more information, see [Updating the cache after a mutation](https://www.apollographql.com/docs/react/data/mutations#updating-the-cache-after-a-mutation).
        *
        * @docGroup 3. Caching options
        */
        update?: MutationUpdaterFunction<TData, TVariables, TCache>;
        /**
        * Optional callback for intercepting queries whose cache data has been updated by the mutation, as well as any queries specified in the `refetchQueries: [...]` list passed to `client.mutate`.
        *
        * Returning a `Promise` from `onQueryUpdated` will cause the final mutation `Promise` to await the returned `Promise`. Returning `false` causes the query to be ignored.
        *
        * @docGroup 1. Operation options
        */
        onQueryUpdated?: OnQueryUpdated<any>;
        /**
        * Specifies how the mutation handles a response that returns both GraphQL errors and partial results.
        *
        * For details, see [GraphQL error policies](https://www.apollographql.com/docs/react/data/error-handling/#graphql-error-policies).
        *
        * The default value is `none`, meaning that the mutation result includes error details but _not_ partial results.
        *
        * @docGroup 1. Operation options
        */
        errorPolicy?: ErrorPolicy;
        /**
        * If you're using [Apollo Link](https://www.apollographql.com/docs/react/api/link/introduction/), this object is the initial value of the `context` object that's passed along your link chain.
        *
        * @docGroup 2. Networking options
        */
        context?: DefaultContext;
        /**
        * Provide `no-cache` if the mutation's result should _not_ be written to the Apollo Client cache.
        *
        * The default value is `network-only` (which means the result _is_ written to the cache).
        *
        * Unlike queries, mutations _do not_ support [fetch policies](https://www.apollographql.com/docs/react/data/queries/#setting-a-fetch-policy) besides `network-only` and `no-cache`.
        *
        * @docGroup 3. Caching options
        */
        fetchPolicy?: MutationFetchPolicy;
        /**
        * To avoid retaining sensitive information from mutation root field
        * arguments, Apollo Client v3.4+ automatically clears any `ROOT_MUTATION`
        * fields from the cache after each mutation finishes. If you need this
        * information to remain in the cache, you can prevent the removal by passing
        * `keepRootFields: true` to the mutation. `ROOT_MUTATION` result data are
        * also passed to the mutation `update` function, so we recommend obtaining
        * the results that way, rather than using this option, if possible.
        */
        keepRootFields?: boolean;
        /**
        * A GraphQL document, often created with `gql` from the `graphql-tag`
        * package, that contains a single mutation inside of it.
        *
        * @docGroup 1. Operation options
        */
        mutation: DocumentNode | TypedDocumentNode<TData, TVariables>;
    } & VariablesOption<NoInfer<TVariables>>;

export interface ExtraWatchQueryOptions {
  /**
   * Whether or not observers should receive initial network loading status when subscribing to this observable.
   * @default true
   */
  notifyOnLoading?: boolean;
}

export interface ExtraQueryOptions {
  /**
   * Whether or not observers should receive initial network loading status when subscribing to this observable.
   * @default true
   */
  notifyOnLoading?: boolean;

  /**
   * Throw errors on the observable's error stream instead of assigning them to the error property of the result object.
   * @default true
   */
  throwError?: boolean;
}

// import { ObservableQuery.SubscribeToMoreOptions } from '@apollo/client';
export interface SubscribeToMoreOptions<TData = unknown, TSubscriptionVariables extends Variables = Variables, TSubscriptionData = TData, TVariables extends Variables = TSubscriptionVariables> {
        subscription: DocumentNode | TypedDocumentNode<TSubscriptionData, TSubscriptionVariables>;
        variables?: TSubscriptionVariables;
        updateQuery?: SubscribeToMoreUpdateQueryFn<TData, TVariables, TSubscriptionData>;
        onError?: (error: ErrorLike) => void;
        context?: DefaultContext;
    }

// import { ObservableQuery.Result as QueryResult } from '@apollo/client';
export type QueryResult<TData, TStates extends DataState<TData>['dataState'] = DataState<TData>['dataState']> = {
        /**
        * A single ErrorLike object describing the error that occured during the latest
        * query execution.
        *
        * For more information, see [Handling operation errors](https://www.apollographql.com/docs/react/data/error-handling/).
        *
        * @docGroup 1. Operation data
        */
        error?: ErrorLike;
        /**
        * If `true`, the query is still in flight.
        *
        * @docGroup 2. Network info
        */
        loading: boolean;
        /**
        * A number indicating the current network state of the query's associated request. [See possible values.](https://github.com/apollographql/apollo-client/blob/d96f4578f89b933c281bb775a39503f6cdb59ee8/src/core/networkStatus.ts#L4)
        *
        * Used in conjunction with the [`notifyOnNetworkStatusChange`](#notifyonnetworkstatuschange) option.
        *
        * @docGroup 2. Network info
        */
        networkStatus: NetworkStatus;

        /**
         * An object containing the result from the most recent _previous_ execution of this query.
         *
         * This value is `undefined` if this is the query's first execution.
         */
        previousData?: GetData<TData, TStates>;
} & GetDataState<TData, TStates>;

export type GetData<TData, TState extends DataState<TData>['dataState']> = GetDataState<TData, TState>['data'];

// import { ApolloClient.QueryResult as SingleQueryResult } from '@apollo/client';
export interface SingleQueryResult<TData = unknown> {
        /**
        * An object containing the result of your GraphQL query after it completes.
        *
        * This value might be `undefined` if a query results in one or more errors (depending on the query's `errorPolicy`).
        *
        * @docGroup 1. Operation data
        */
        data: TData | undefined;
        /**
        * A single ErrorLike object describing the error that occured during the latest
        * query execution.
        *
        * For more information, see [Handling operation errors](https://www.apollographql.com/docs/react/data/error-handling/).
        *
        * @docGroup 1. Operation data
        */
        error?: ErrorLike;
    }

export interface MutationResult<TData = unknown> {
  data: TData | undefined;
  error?: ErrorLike;
  extensions?: Record<string, any>;
}

export interface SubscriptionResult<TData = unknown> {
  data?: TData;
  error?: ErrorLike;
  extensions?: Record<string, any>;
}
