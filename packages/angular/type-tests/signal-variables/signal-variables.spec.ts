/**
 * A line that merely compiles is an assertion here: it fails the typecheck the moment the option stops
 * accepting that form.
 */

import type { Apollo } from '@apollo-orbit/angular';
import type { TypedDocumentNode } from '@apollo/client';
import { test } from 'vitest';

interface Book { __typename: 'Book'; id: string; name: string }
interface BookData { book: Book }
interface BookVariables { id: string }
interface NewBookData { newBook: Book }

declare const apollo: Apollo;
declare const BOOK_QUERY: TypedDocumentNode<BookData, BookVariables>;
declare const BOOK_QUERY_OPTIONAL: TypedDocumentNode<BookData, { id?: string }>;
declare const NEW_BOOK: TypedDocumentNode<NewBookData, BookVariables>;
declare const NEW_BOOK_OPTIONAL: TypedDocumentNode<NewBookData, { id?: string }>;
declare function reactive<T>(value: T): () => T;

test('signal.query takes its variables from a function', () => {
  void apollo.signal.query({ query: BOOK_QUERY, variables: () => ({ id: '1' }) });
  void apollo.signal.query({ query: BOOK_QUERY, variables: () => null });
  void apollo.signal.query({ query: BOOK_QUERY, variables: reactive({ id: '1' }) });
  void apollo.signal.query({ query: BOOK_QUERY, lazy: true, variables: () => ({ id: '1' }) });
  void apollo.signal.query({ query: BOOK_QUERY, lazy: true });
  void apollo.signal.query({ query: BOOK_QUERY_OPTIONAL, variables: () => ({ id: '1' }) });
  void apollo.signal.query({ query: BOOK_QUERY_OPTIONAL });

  // @ts-expect-error a plain object reads any signal among its values once, so the option does not take one.
  void apollo.signal.query({ query: BOOK_QUERY, variables: { id: '1' } });
  // @ts-expect-error nor a plain `null`, which `lazy` says better and without leaving `enabled` reading true.
  void apollo.signal.query({ query: BOOK_QUERY, variables: null });
  // @ts-expect-error the returned object is checked against the document's variables.
  void apollo.signal.query({ query: BOOK_QUERY, variables: () => ({ id: 1 }) });
  // @ts-expect-error an eager query requires variables.
  void apollo.signal.query({ query: BOOK_QUERY });
  // @ts-expect-error
  void apollo.signal.query({ query: BOOK_QUERY, lazy: false });
});

test('signal.query.once takes its variables from a function', () => {
  void apollo.signal.query.once({ query: BOOK_QUERY, variables: () => ({ id: '1' }) });
  void apollo.signal.query.once({ query: BOOK_QUERY, variables: () => null });
  void apollo.signal.query.once({ query: BOOK_QUERY, lazy: true, variables: () => ({ id: '1' }) });
  void apollo.signal.query.once({ query: BOOK_QUERY, lazy: true });
  void apollo.signal.query.once({ query: BOOK_QUERY_OPTIONAL, variables: () => ({ id: '1' }) });
  void apollo.signal.query.once({ query: BOOK_QUERY_OPTIONAL });

  // @ts-expect-error
  void apollo.signal.query.once({ query: BOOK_QUERY, variables: { id: '1' } });
  // @ts-expect-error
  void apollo.signal.query.once({ query: BOOK_QUERY, variables: null });
  // @ts-expect-error
  void apollo.signal.query.once({ query: BOOK_QUERY, variables: () => ({ id: 1 }) });
  // @ts-expect-error
  void apollo.signal.query.once({ query: BOOK_QUERY });
  // @ts-expect-error
  void apollo.signal.query.once({ query: BOOK_QUERY, lazy: false });
});

test('signal.subscription takes its variables from a function', () => {
  void apollo.signal.subscription({ subscription: NEW_BOOK, variables: () => ({ id: '1' }) });
  void apollo.signal.subscription({ subscription: NEW_BOOK, variables: () => null });
  void apollo.signal.subscription({ subscription: NEW_BOOK, lazy: true, variables: () => ({ id: '1' }) });
  void apollo.signal.subscription({ subscription: NEW_BOOK, lazy: true });
  void apollo.signal.subscription({ subscription: NEW_BOOK_OPTIONAL });

  // @ts-expect-error
  void apollo.signal.subscription({ subscription: NEW_BOOK, variables: { id: '1' } });
  // @ts-expect-error
  void apollo.signal.subscription({ subscription: NEW_BOOK, variables: null });
  // @ts-expect-error
  void apollo.signal.subscription({ subscription: NEW_BOOK, variables: () => ({ id: 1 }) });
  // @ts-expect-error
  void apollo.signal.subscription({ subscription: NEW_BOOK });
  // @ts-expect-error
  void apollo.signal.subscription({ subscription: NEW_BOOK, lazy: false });
});

test('cache reads require the document variables and have nothing to terminate', () => {
  void apollo.signal.cacheQuery({ query: BOOK_QUERY, variables: () => ({ id: '1' }) });
  void apollo.signal.cacheQuery({ query: BOOK_QUERY_OPTIONAL });
  void apollo.signal.fragment({ fragment: BOOK_QUERY, from: 'Book:1', variables: () => ({ id: '1' }) });
  void apollo.signal.fragment({ fragment: BOOK_QUERY_OPTIONAL, from: 'Book:1' });

  // @ts-expect-error
  void apollo.signal.cacheQuery({ query: BOOK_QUERY });
  // @ts-expect-error
  void apollo.signal.cacheQuery.required({ query: BOOK_QUERY });
  // @ts-expect-error
  void apollo.signal.fragment({ fragment: BOOK_QUERY, from: 'Book:1' });
  // @ts-expect-error a cache read always reads, so its function has no `null` to return.
  void apollo.signal.cacheQuery({ query: BOOK_QUERY, variables: () => null });
});
