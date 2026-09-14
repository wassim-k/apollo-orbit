/**
 * The three slots take different policies on purpose, so a result resolved against the wrong one fails rather
 * than passing by coincidence. Its counterpart in `../no-defaults` declares none of them.
 */

import type { Apollo, ErrorLike, SignalQuery } from '@apollo-orbit/angular';
import type { TypedDocumentNode } from '@apollo/client';
import { expectTypeOf } from 'expect-type';
import { test } from 'vitest';
import type { Observable } from 'rxjs';

declare module '@apollo/client' {
  namespace ApolloClient {
    namespace DeclareDefaultOptions {
      interface Query { errorPolicy: 'all' }
      interface WatchQuery { errorPolicy: 'ignore' }
      interface Mutate { errorPolicy: 'none' }
    }
  }
}

interface Book { __typename: 'Book'; id: string; name: string }
interface BookData { book: Book }
interface BookVariables { id: string }
interface AddBookData { addBook: Book }
interface AddBookVariables { name: string }

declare const apollo: Apollo;
declare const BOOK_QUERY: TypedDocumentNode<BookData, BookVariables>;
declare const ADD_BOOK: TypedDocumentNode<AddBookData, AddBookVariables>;
declare function emitted<T>(source: Observable<T>): T;
declare function resolved<T>(source: Promise<T>): T;

type MaybeError = ErrorLike | undefined;

const variables = (): BookVariables => ({ id: '1' });

declare const dynamicPolicy: 'all' | 'none';

test('a declared default flips Apollo Client to its modern signatures', () => {
  // @ts-expect-error explicit generics are rejected once modern signatures are active.
  void apollo.client.query<BookData, BookVariables>({ query: BOOK_QUERY, variables: variables() });

  expectTypeOf(apollo).not.toBeAny();
});

test('apollo.query resolves against the declared query slot of all', () => {
  const defaults = emitted(apollo.query({ query: BOOK_QUERY, variables: variables() }));

  expectTypeOf(defaults).not.toBeAny();
  expectTypeOf(defaults.data).toEqualTypeOf<BookData | undefined>();
  expectTypeOf(defaults.error).toEqualTypeOf<MaybeError>();

  const none = emitted(apollo.query({ query: BOOK_QUERY, variables: variables(), errorPolicy: 'none' }));

  expectTypeOf(none.data).toEqualTypeOf<BookData>();
});

test('apollo.mutate resolves against the declared mutate slot of none', () => {
  const mutate = emitted(apollo.mutate({ mutation: ADD_BOOK, variables: { name: 'a' } }));

  expectTypeOf(mutate.data).toEqualTypeOf<AddBookData>();
  expectTypeOf(mutate.error).toEqualTypeOf<undefined>();
});

test('a policy reaches the result through a type argument or the document, never silently', () => {
  expectTypeOf(emitted(apollo.query<BookData>({ query: BOOK_QUERY, variables: variables() })).data).not.toBeAny();

  // @ts-expect-error type arguments infer all-or-nothing, so naming one pins `TErrorPolicy` to its default.
  void apollo.query<BookData>({ query: BOOK_QUERY, variables: variables(), errorPolicy: 'all' });

  expectTypeOf(emitted(apollo.query<BookData, BookVariables, 'all'>({ query: BOOK_QUERY, variables: variables(), errorPolicy: 'all' })).data).toEqualTypeOf<BookData | undefined>();
  expectTypeOf(emitted(apollo.query({ query: BOOK_QUERY, variables: variables(), errorPolicy: 'all' })).data).toEqualTypeOf<BookData | undefined>();
  expectTypeOf(emitted(apollo.query({ query: BOOK_QUERY, variables: variables(), errorPolicy: dynamicPolicy })).data).toEqualTypeOf<BookData | undefined>();
});

test('the signal operations resolve against the declared watchQuery slot of ignore', () => {
  const singleQuery = resolved(apollo.signal.query.once({ query: BOOK_QUERY, variables }).execute());

  expectTypeOf(singleQuery.data).toEqualTypeOf<BookData | undefined>();
  expectTypeOf(singleQuery.error).toEqualTypeOf<undefined>();

  const watchQuery = resolved(apollo.signal.query({ query: BOOK_QUERY, variables }).refetch());

  expectTypeOf(watchQuery.data).toEqualTypeOf<BookData | undefined>();
  expectTypeOf(watchQuery.error).toEqualTypeOf<undefined>();

  const observable = resolved(apollo.watchQuery({ query: BOOK_QUERY, variables: variables() }).refetch());

  expectTypeOf(observable.data).toEqualTypeOf<BookData | undefined>();
  expectTypeOf(observable.error).toEqualTypeOf<undefined>();
});

test('fetchMore resolves against neither the query policy nor the declared default', () => {
  const fetchMoreOf = apollo.signal.query({ query: BOOK_QUERY, variables, errorPolicy: 'all' });

  expectTypeOf(resolved(fetchMoreOf.fetchMore({ variables: variables() })).data).toEqualTypeOf<BookData>();
});

test('signal.mutation resolves against the declared mutate slot of none', () => {
  const mutation = apollo.signal.mutation(ADD_BOOK);

  expectTypeOf(resolved(mutation.mutate({ variables: { name: 'a' } })).data).toEqualTypeOf<AddBookData>();
  expectTypeOf(mutation.error()).toEqualTypeOf<MaybeError>();

  const ignored = apollo.signal.mutation(ADD_BOOK, { errorPolicy: 'ignore' });
  expectTypeOf(resolved(ignored.mutate({ variables: { name: 'a' } })).data).toEqualTypeOf<AddBookData | undefined>();
  expectTypeOf(ignored.error()).toEqualTypeOf<undefined>();
});

test('an annotation that writes no policy claims no slot', () => {
  const anyQuery: SignalQuery<BookData, BookVariables> = apollo.signal.query({ query: BOOK_QUERY, variables, errorPolicy: 'none' });

  expectTypeOf(resolved(anyQuery.refetch()).error).toEqualTypeOf<MaybeError>();
});
