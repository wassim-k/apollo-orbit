import { ApolloClient, ErrorLike, ErrorPolicy } from '@apollo/client';
import { OptionWithFallback, preventUnhandledRejection } from '@apollo/client/utilities/internal';

/**
 * The shape Apollo Client rejects its own aborts with, so one `error.name === 'AbortError'` check covers both.
 */
const abortError = (): Error => new DOMException('The operation was aborted.', 'AbortError');

type EffectiveErrorPolicy<TErrorPolicy extends ErrorPolicy | undefined, TDefaults extends { errorPolicy: ErrorPolicy }> =
  OptionWithFallback<{ errorPolicy: TErrorPolicy }, TDefaults, 'errorPolicy'> & ErrorPolicy;

/**
 * The `errorPolicy` an operation runs under: the one it declares, or the ambient default declared for its kind.
 */
export type EffectiveQueryErrorPolicy<TErrorPolicy extends ErrorPolicy | undefined> =
  EffectiveErrorPolicy<TErrorPolicy, ApolloClient.DefaultOptions.Query.Calculated>;

export type EffectiveWatchQueryErrorPolicy<TErrorPolicy extends ErrorPolicy | undefined> =
  EffectiveErrorPolicy<TErrorPolicy, ApolloClient.DefaultOptions.WatchQuery.Calculated>;

export type EffectiveMutateErrorPolicy<TErrorPolicy extends ErrorPolicy | undefined> =
  EffectiveErrorPolicy<TErrorPolicy, ApolloClient.DefaultOptions.Mutate.Calculated>;

/**
 * Only `all` and `ignore` can resolve, because theirs are the only result types admitting `undefined` data.
 */
export const resultWithoutData = <TData>(
  errorPolicy: ErrorPolicy | undefined,
  error?: ErrorLike
): Promise<ApolloClient.QueryResult<TData, ErrorPolicy>> => preventUnhandledRejection(
  errorPolicy === 'all' ? Promise.resolve<ApolloClient.QueryResult<TData, 'all'>>({ data: undefined, error })
    : errorPolicy === 'ignore' ? Promise.resolve<ApolloClient.QueryResult<TData, 'ignore'>>({ data: undefined })
      : Promise.reject<ApolloClient.QueryResult<TData, 'none'>>(error ?? abortError())
);
