/**
 * With no `ApolloClient.DeclareDefaultOptions` declared, every ambient default falls back to Apollo Client's own
 * `errorPolicy: 'none'`. Its counterpart in `../with-defaults` declares them.
 */

import type { Injector } from '@angular/core';
import type { Apollo, ApolloCacheEx, CacheQueryCompleteResult, CacheQueryData, CacheQueryResult, ErrorLike, MutationOptions, QueryObservable, QueryOptions, SignalMutation, SignalQuery, SignalSingleQuery, WatchQueryOptions } from '@apollo-orbit/angular';
import type { DataValue, MissingFieldError, TypedDocumentNode } from '@apollo/client';
import { CacheQueryObservable, mapMutation, mapMutationResult, SignalCacheQuery } from '@apollo-orbit/angular';
import { expectTypeOf } from 'expect-type';
import { test } from 'vitest';
import type { Observable } from 'rxjs';

interface Book { __typename: 'Book'; id: string; name: string }
interface BookData { book: Book }
interface BookVariables { id: string }
interface AddBookData { addBook: Book }
interface AddBookVariables { name: string }

declare const apollo: Apollo;
declare const cache: ApolloCacheEx;
declare const injector: Injector;
declare const required: boolean;
declare const BOOK_QUERY: TypedDocumentNode<BookData, BookVariables>;
declare const ADD_BOOK: TypedDocumentNode<AddBookData, AddBookVariables>;
declare function emitted<T>(source: Observable<T>): T;
declare function resolved<T>(source: Promise<T>): T;

type MaybeError = ErrorLike | undefined;

const variables = (): BookVariables => ({ id: '1' });

declare const dynamicPolicy: 'all' | 'none';
declare const includePartial: boolean;
declare const anyPolicyObservable: QueryObservable<BookData, BookVariables>;

test('nothing declared leaves Apollo Client on its classic signatures', () => {
  void apollo.client.query<BookData, BookVariables>({ query: BOOK_QUERY, variables: variables() });

  expectTypeOf(apollo).not.toBeAny();
});

test('apollo.query reports the policy it ran under', () => {
  const defaults = emitted(apollo.query({ query: BOOK_QUERY, variables: variables() }));

  expectTypeOf(defaults).not.toBeAny();
  expectTypeOf(defaults.data).toEqualTypeOf<BookData>();
  expectTypeOf(defaults.error).toEqualTypeOf<undefined>();

  expectTypeOf(emitted(apollo.query({ query: BOOK_QUERY, variables: variables(), errorPolicy: 'none' })).data).toEqualTypeOf<BookData>();

  const all = emitted(apollo.query({ query: BOOK_QUERY, variables: variables(), errorPolicy: 'all' }));

  expectTypeOf(all.data).toEqualTypeOf<BookData | undefined>();
  expectTypeOf(all.error).toEqualTypeOf<MaybeError>();

  const ignore = emitted(apollo.query({ query: BOOK_QUERY, variables: variables(), errorPolicy: 'ignore' }));

  expectTypeOf(ignore.data).toEqualTypeOf<BookData | undefined>();
  expectTypeOf(ignore.error).toEqualTypeOf<undefined>();
});

test('apollo.mutate reports the policy it ran under', () => {
  const defaults = emitted(apollo.mutate({ mutation: ADD_BOOK, variables: { name: 'a' } }));

  expectTypeOf(defaults.data).toEqualTypeOf<AddBookData>();
  expectTypeOf(defaults.error).toEqualTypeOf<undefined>();

  const all = emitted(apollo.mutate({ mutation: ADD_BOOK, variables: { name: 'a' }, errorPolicy: 'all' }));

  expectTypeOf(all.data).toEqualTypeOf<AddBookData | undefined>();
  expectTypeOf(all.error).toEqualTypeOf<MaybeError>();

  const ignore = emitted(apollo.mutate({ mutation: ADD_BOOK, variables: { name: 'a' }, errorPolicy: 'ignore' }));

  expectTypeOf(ignore.data).toEqualTypeOf<AddBookData | undefined>();
  expectTypeOf(ignore.error).toEqualTypeOf<undefined>();
});

test('a policy reaches the result through a type argument or the document, never silently', () => {
  expectTypeOf(emitted(apollo.query<BookData>({ query: BOOK_QUERY, variables: variables() })).data).not.toBeAny();

  // @ts-expect-error type arguments infer all-or-nothing, so naming one pins `TErrorPolicy` to its default.
  void apollo.query<BookData>({ query: BOOK_QUERY, variables: variables(), errorPolicy: 'all' });

  expectTypeOf(emitted(apollo.query<BookData, BookVariables, 'all'>({ query: BOOK_QUERY, variables: variables(), errorPolicy: 'all' })).data).toEqualTypeOf<BookData | undefined>();
  expectTypeOf(emitted(apollo.query({ query: BOOK_QUERY, variables: variables(), errorPolicy: 'all' })).data).toEqualTypeOf<BookData | undefined>();
  expectTypeOf(emitted(apollo.query({ query: BOOK_QUERY, variables: variables(), errorPolicy: dynamicPolicy })).data).toEqualTypeOf<BookData | undefined>();
});

test('signal.query.once reports the policy it ran under', () => {
  const defaults = resolved(apollo.signal.query.once({ query: BOOK_QUERY, variables }).execute());

  expectTypeOf(defaults.data).toEqualTypeOf<BookData>();
  expectTypeOf(defaults.error).toEqualTypeOf<undefined>();

  expectTypeOf(resolved(apollo.signal.query.once({ query: BOOK_QUERY, variables, errorPolicy: 'all' }).execute()).data).toEqualTypeOf<BookData | undefined>();
});

test('signal.query().refetch reports the policy it ran under', () => {
  const defaults = resolved(apollo.signal.query({ query: BOOK_QUERY, variables }).refetch());

  expectTypeOf(defaults.data).toEqualTypeOf<BookData>();
  expectTypeOf(defaults.error).toEqualTypeOf<undefined>();

  expectTypeOf(resolved(apollo.signal.query({ query: BOOK_QUERY, variables, errorPolicy: 'all' }).refetch()).data).toEqualTypeOf<BookData | undefined>();
});

test('fetchMore inherits neither the query policy nor the ambient default', () => {
  const fetchMoreOf = apollo.signal.query({ query: BOOK_QUERY, variables, errorPolicy: 'all' });

  expectTypeOf(resolved(fetchMoreOf.fetchMore({ variables: variables() })).data).toEqualTypeOf<BookData>();
  expectTypeOf(resolved(fetchMoreOf.fetchMore({ variables: variables(), errorPolicy: 'all' })).data).toEqualTypeOf<BookData | undefined>();
});

test('signal.mutation reports the policy it ran under', () => {
  const mutation = apollo.signal.mutation(ADD_BOOK);

  expectTypeOf(resolved(mutation.mutate({ variables: { name: 'a' } })).data).toEqualTypeOf<AddBookData>();
  expectTypeOf(mutation.error()).toEqualTypeOf<MaybeError>();

  const mutationAll = apollo.signal.mutation(ADD_BOOK, { errorPolicy: 'all' });

  expectTypeOf(resolved(mutationAll.mutate({ variables: { name: 'a' } })).data).toEqualTypeOf<AddBookData | undefined>();
});

test('the policy sticks on a watched observable, so reobserve may not change it', () => {
  expectTypeOf(resolved(apollo.watchQuery({ query: BOOK_QUERY, variables: variables() }).refetch()).data).toEqualTypeOf<BookData>();
  expectTypeOf(resolved(apollo.watchQuery({ query: BOOK_QUERY, variables: variables(), errorPolicy: 'all' }).setVariables(variables())).data).toEqualTypeOf<BookData | undefined>();
  expectTypeOf(resolved(apollo.watchQuery({ query: BOOK_QUERY, variables: variables() }).reobserve()).data).toEqualTypeOf<BookData>();

  // @ts-expect-error a later `refetch()` would otherwise resolve under a policy its own type contradicts.
  void apollo.watchQuery({ query: BOOK_QUERY, variables: variables() }).reobserve({ errorPolicy: 'all' });

  void anyPolicyObservable.reobserve({ errorPolicy: 'all' });
});

test('an unwritten policy parameter on a class annotation means any policy', () => {
  const anyQuery: SignalQuery<BookData, BookVariables> = apollo.signal.query({ query: BOOK_QUERY, variables, errorPolicy: 'all' });
  const anySingleQuery: SignalSingleQuery<BookData, BookVariables> = apollo.signal.query.once({ query: BOOK_QUERY, variables, errorPolicy: 'ignore' });
  const anyMutation: SignalMutation<AddBookData, AddBookVariables> = apollo.signal.mutation(ADD_BOOK, { errorPolicy: 'ignore' });
  const anyObservable: QueryObservable<BookData, BookVariables, 'empty' | 'complete' | 'streaming'> = apollo.watchQuery({ query: BOOK_QUERY, variables: variables(), errorPolicy: 'all' });

  expectTypeOf(resolved(anyQuery.refetch()).data).toEqualTypeOf<BookData | undefined>();
  expectTypeOf(resolved(anySingleQuery.execute()).error).toEqualTypeOf<MaybeError>();
  expectTypeOf(anyMutation.error()).toEqualTypeOf<MaybeError>();
  expectTypeOf(resolved(anyObservable.refetch()).data).toEqualTypeOf<BookData | undefined>();

  // @ts-expect-error a written policy narrows the annotation, so 'none' rejects a query created under 'all'.
  const noneQuery: SignalQuery<BookData, BookVariables, 'empty' | 'complete' | 'streaming', 'none'> = apollo.signal.query({ query: BOOK_QUERY, variables, errorPolicy: 'all' });
  // @ts-expect-error
  const noneMutation: SignalMutation<AddBookData, AddBookVariables, 'none'> = apollo.signal.mutation(ADD_BOOK, { errorPolicy: 'all' });

  expectTypeOf(noneQuery).not.toBeAny();
  expectTypeOf(noneMutation).not.toBeAny();
});

// A second `Omit` over an options type collapses the union that carries this, silently.
test('required variables stay required', () => {
  // @ts-expect-error
  void apollo.signal.query.once({ query: BOOK_QUERY, injector: undefined });
  // @ts-expect-error
  void apollo.signal.query({ query: BOOK_QUERY, injector: undefined });
  // @ts-expect-error
  void apollo.signal.mutation(ADD_BOOK).mutate({});
});

test('an options type is an annotation, not a call, so it admits any policy', () => {
  const declaredOptions: QueryOptions<BookData, BookVariables> = { query: BOOK_QUERY, variables: variables(), errorPolicy: 'all' };
  const declaredWatch: WatchQueryOptions<BookData, BookVariables> = { query: BOOK_QUERY, variables: variables(), errorPolicy: 'all', returnPartialData: true };
  const declaredMutation: MutationOptions<AddBookData, AddBookVariables> = { mutation: ADD_BOOK, variables: { name: 'a' }, errorPolicy: 'ignore' };

  expectTypeOf(declaredOptions).not.toBeAny();
  expectTypeOf(declaredWatch).not.toBeAny();
  expectTypeOf(declaredMutation).not.toBeAny();

  expectTypeOf(emitted(apollo.query({ query: BOOK_QUERY, variables: variables() })).data).toEqualTypeOf<BookData>();
});

test('mapMutation replaces data and carries the policy through', () => {
  const mappedNone = emitted(apollo.mutate({ mutation: ADD_BOOK, variables: { name: 'a' }, errorPolicy: 'none' }).pipe(mapMutation(data => data.addBook)));

  expectTypeOf(mappedNone.data).toEqualTypeOf<Book>();
  expectTypeOf(mappedNone.error).toEqualTypeOf<undefined>();

  const mappedAll = emitted(apollo.mutate({ mutation: ADD_BOOK, variables: { name: 'a' }, errorPolicy: 'all' }).pipe(mapMutation(data => data.addBook)));

  expectTypeOf(mappedAll.data).toEqualTypeOf<Book | undefined>();
  expectTypeOf(mappedAll.error).toEqualTypeOf<MaybeError>();
});

// Matching Apollo's own `QueryResultMap` and React's `useLazyQuery.ExecFunction` rather than being stricter
// than the client it wraps.
test('a declared none policy still guarantees data', () => {
  const options = { query: BOOK_QUERY, variables: variables(), errorPolicy: 'none' } as const;

  expectTypeOf(emitted(apollo.query(options)).data).toEqualTypeOf<BookData>();
  expectTypeOf(resolved(apollo.signal.query.once({ ...options, variables }).execute()).data).toEqualTypeOf<BookData>();
});

test('only a statically false returnPartialData rules out a partial result', () => {
  expectTypeOf(apollo.signal.query({ query: BOOK_QUERY, variables }).result().dataState).toEqualTypeOf<'empty' | 'complete' | 'streaming'>();
  expectTypeOf(apollo.signal.query({ query: BOOK_QUERY, variables, returnPartialData: false }).result().dataState).toEqualTypeOf<'empty' | 'complete' | 'streaming'>();
  expectTypeOf(apollo.signal.query({ query: BOOK_QUERY, variables, returnPartialData: true }).result().dataState).toEqualTypeOf<'empty' | 'complete' | 'streaming' | 'partial'>();
  expectTypeOf(apollo.signal.query({ query: BOOK_QUERY, variables, returnPartialData: includePartial }).result().dataState).toEqualTypeOf<'empty' | 'complete' | 'streaming' | 'partial'>();
  expectTypeOf(apollo.watchQuery({ query: BOOK_QUERY, variables: variables(), returnPartialData: includePartial }).getCurrentResult().dataState).toEqualTypeOf<'empty' | 'complete' | 'streaming' | 'partial'>();
});

test('null mutation data reaches the mapper', () => {
  const result = { data: null as { value: string } | null };

  // @ts-expect-error mapping excludes undefined, not null.
  mapMutationResult(result, data => data.value);
  expectTypeOf(mapMutationResult(result, data => data?.value ?? 'empty').data).toEqualTypeOf<string>();
});

test('cache constructors infer their result from the required mode', () => {
  const options = { query: BOOK_QUERY, variables: variables() };
  const signalOptions = { query: BOOK_QUERY, variables };

  expectTypeOf(new CacheQueryObservable(cache, options).getCurrentResult()).toEqualTypeOf<CacheQueryResult<BookData>>();
  expectTypeOf(new CacheQueryObservable(cache, options, false).getCurrentResult()).toEqualTypeOf<CacheQueryResult<BookData>>();
  expectTypeOf(new CacheQueryObservable(cache, options, true).getCurrentResult()).toEqualTypeOf<CacheQueryCompleteResult<BookData>>();
  expectTypeOf(new CacheQueryObservable(cache, options, required).getCurrentResult()).toEqualTypeOf<CacheQueryResult<BookData>>();

  expectTypeOf(new SignalCacheQuery(injector, cache, signalOptions).result()).toEqualTypeOf<CacheQueryResult<BookData>>();
  expectTypeOf(new SignalCacheQuery(injector, cache, signalOptions, false).result()).toEqualTypeOf<CacheQueryResult<BookData>>();
  expectTypeOf(new SignalCacheQuery(injector, cache, signalOptions, true).result()).toEqualTypeOf<CacheQueryCompleteResult<BookData>>();
  expectTypeOf(new SignalCacheQuery(injector, cache, signalOptions, required).result()).toEqualTypeOf<CacheQueryResult<BookData>>();

  expectTypeOf(emitted(new CacheQueryObservable(cache, options, true))).toEqualTypeOf<CacheQueryCompleteResult<BookData>>();
  expectTypeOf(emitted(cache.watchQuery.required({ query: BOOK_QUERY, variables: variables() })).data).toEqualTypeOf<BookData>();
  expectTypeOf(apollo.signal.cacheQuery.required(signalOptions).data()).toEqualTypeOf<BookData>();
  expectTypeOf(new SignalCacheQuery(injector, cache, signalOptions, true).complete()).toEqualTypeOf<true>();
  expectTypeOf(new SignalCacheQuery(injector, cache, signalOptions, true).missing()).toEqualTypeOf<undefined>();
});

test('cache selector types preserve required, optional, and partial data modes', () => {
  const options = { query: BOOK_QUERY, variables };
  const optional = apollo.signal.cacheQuery(options);
  const partial = apollo.signal.cacheQuery({ ...options, returnPartialData: true });
  const dynamic = new SignalCacheQuery(injector, cache, { ...options, returnPartialData: required }, required);

  expectTypeOf<CacheQueryData<BookData>>().toEqualTypeOf<BookData | null>();
  expectTypeOf<CacheQueryData<BookData, true>>().toEqualTypeOf<BookData | DataValue.Partial<BookData> | null>();
  expectTypeOf<CacheQueryData<BookData, true, true>>().toEqualTypeOf<BookData>();
  expectTypeOf(optional.data()).toEqualTypeOf<BookData | null>();
  expectTypeOf(optional.complete()).toEqualTypeOf<boolean>();
  expectTypeOf(optional.missing()).toEqualTypeOf<MissingFieldError | undefined>();
  expectTypeOf(partial.data()).toEqualTypeOf<BookData | DataValue.Partial<BookData> | null>();
  expectTypeOf(dynamic.data()).toEqualTypeOf<BookData | DataValue.Partial<BookData> | null>();
  expectTypeOf(dynamic.complete()).toEqualTypeOf<boolean>();
  expectTypeOf(dynamic.missing()).toEqualTypeOf<MissingFieldError | undefined>();
});

test('a required constructor cannot omit or disable its runtime check', () => {
  const options = { query: BOOK_QUERY, variables: variables() };
  const signalOptions = { query: BOOK_QUERY, variables };

  // @ts-expect-error required mode must be enabled at runtime.
  new CacheQueryObservable<BookData, BookVariables, false, true>(cache, options);
  // @ts-expect-error false cannot implement a required result.
  new CacheQueryObservable<BookData, BookVariables, false, true>(cache, options, false);
  // @ts-expect-error undefined cannot implement a required result.
  new CacheQueryObservable<BookData, BookVariables, false, true>(cache, options, undefined);

  // @ts-expect-error required mode must be enabled at runtime.
  new SignalCacheQuery<BookData, BookVariables, false, true>(injector, cache, signalOptions);
  // @ts-expect-error false cannot implement a required result.
  new SignalCacheQuery<BookData, BookVariables, false, true>(injector, cache, signalOptions, false);
  // @ts-expect-error undefined cannot implement a required result.
  new SignalCacheQuery<BookData, BookVariables, false, true>(injector, cache, signalOptions, undefined);
});
