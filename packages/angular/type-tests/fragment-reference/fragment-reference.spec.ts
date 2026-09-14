import type { Apollo } from '@apollo-orbit/angular';
import type { TypedDocumentNode } from '@apollo/client';
import type { HKT } from '@apollo/client/utilities';
import { expectTypeOf } from 'expect-type';
import { test } from 'vitest';

type Reference<TData extends { __typename: string }> = { __typename: TData['__typename']; id: string };

interface StrictReference extends HKT {
  arg1: { __typename: string };
  return: Reference<this['arg1']>;
}

declare module '@apollo/client' {
  interface TypeOverrides { FromOptionValue: StrictReference }
}

declare const apollo: Apollo;
declare const fragment: TypedDocumentNode<{ __typename: 'Book'; title: string }>;

test('fragment APIs respect custom reference types while retaining nullable and array forms', () => {
  expectTypeOf(apollo.watchFragment({ fragment, from: { __typename: 'Book', id: '1' } })).not.toBeAny();
  expectTypeOf(apollo.signal.fragment({ fragment, from: () => [{ __typename: 'Book', id: '1' }, null] })).not.toBeAny();
  expectTypeOf(apollo.signal.fragment({ fragment, from: null })).not.toBeAny();

  // @ts-expect-error the configured reference requires __typename
  apollo.watchFragment({ fragment, from: { id: '1' } });
  // @ts-expect-error the configured reference forbids undefined identifiers
  apollo.signal.fragment({ fragment, from: { __typename: 'Book', id: undefined } });
  // @ts-expect-error the typename must match the fragment
  apollo.signal.fragment<{ __typename: 'Book'; title: string }>({ fragment, from: { __typename: 'Author', id: '1' } });
});
