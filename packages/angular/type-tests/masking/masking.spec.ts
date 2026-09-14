/**
 * Codegen emits types that are already masked: a parent carries `$fragmentRefs` in place of the fragment's own
 * fields. So `MaybeMasked` is the identity and `Unmasked` is the half that does work, widening a type back to
 * the full shape wherever a caller has to supply complete data.
 */

import type { Apollo, CacheQueryData, CacheQueryResult, MutationOptions, SignalFragmentResult } from '@apollo-orbit/angular';
import type { DataValue, TypedDocumentNode } from '@apollo/client';
import type { GraphQLCodegenDataMasking, MaybeMasked, Unmasked } from '@apollo/client/masking';
import { expectTypeOf } from 'expect-type';
import type { Observable } from 'rxjs';
import { test } from 'vitest';

declare module '@apollo/client' {
  export interface TypeOverrides extends GraphQLCodegenDataMasking.TypeOverrides { }
}

interface BookFields { __typename: 'Book'; name: string; ' $fragmentName'?: 'BookFields' }
interface Book { __typename: 'Book'; id: string; ' $fragmentRefs'?: { BookFields: BookFields } }
interface BookData { book: Book }
interface AddBookData { addBook: Book }
interface AddBookVariables { name: string }

interface UnmaskedBook { __typename: 'Book'; id: string; name: string }
interface UnmaskedAddBookData { addBook: UnmaskedBook }

declare const apollo: Apollo;
declare const BOOK_QUERY: TypedDocumentNode<BookData, Record<string, never>>;
declare const ADD_BOOK: TypedDocumentNode<AddBookData, AddBookVariables>;
declare function emitted<T>(source: Observable<T>): T;

declare const cacheResult: CacheQueryResult<BookData>;
declare const fragmentResult: SignalFragmentResult<Book>;

test('MaybeMasked is the identity and Unmasked unwraps the fragment refs', () => {
  expectTypeOf<MaybeMasked<BookData>>().toEqualTypeOf<BookData>();
  expectTypeOf<Unmasked<AddBookData>>().toEqualTypeOf<UnmaskedAddBookData>();
});

test('reads through the client stay masked', () => {
  expectTypeOf(emitted(apollo.query({ query: BOOK_QUERY })).data).toEqualTypeOf<BookData>();
  expectTypeOf(emitted(apollo.watchQuery({ query: BOOK_QUERY })).data).toEqualTypeOf<BookData | undefined>();
  expectTypeOf(fragmentResult.data).toExtend<Book | DataValue.Partial<Book>>();
});

test('a cache read gives the full shape the store holds', () => {
  expectTypeOf<CacheQueryData<BookData>>().toEqualTypeOf<{ book: UnmaskedBook } | null>();
  expectTypeOf<CacheQueryData<BookData, true, true>>().toEqualTypeOf<{ book: UnmaskedBook }>();
  expectTypeOf(apollo.signal.cacheQuery.required({ query: BOOK_QUERY }).data()).toEqualTypeOf<{ book: UnmaskedBook }>();

  if (cacheResult.complete) {
    expectTypeOf(cacheResult.data).toEqualTypeOf<{ book: UnmaskedBook }>();
  }
});

test('an optimistic response must carry the fields the fragment hides', () => {
  const optimistic: MutationOptions<AddBookData, AddBookVariables> = {
    mutation: ADD_BOOK,
    variables: { name: 'a' },
    optimisticResponse: { addBook: { __typename: 'Book', id: '1', name: 'a' } }
  };

  const missingName: MutationOptions<AddBookData, AddBookVariables> = {
    mutation: ADD_BOOK,
    variables: { name: 'a' },
    // @ts-expect-error the masked shape is not enough: `name` is required here.
    optimisticResponse: { addBook: { __typename: 'Book', id: '1' } }
  };

  expectTypeOf(optimistic).not.toBeAny();
  void missingName;
});
