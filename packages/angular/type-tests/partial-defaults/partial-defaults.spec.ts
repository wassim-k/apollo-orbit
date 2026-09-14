import type { Apollo } from '@apollo-orbit/angular';
import type { TypedDocumentNode } from '@apollo/client';
import { expectTypeOf } from 'expect-type';
import { test } from 'vitest';

declare module '@apollo/client' {
  namespace ApolloClient {
    namespace DeclareDefaultOptions {
      interface WatchQuery { returnPartialData: true }
    }
  }
}

declare const apollo: Apollo;
declare const query: TypedDocumentNode<{ value: string }>;
declare const includePartial: boolean;

test('resolves partial data against declared watch defaults and explicit overrides', () => {
  const watch = apollo.watchQuery({ query });
  expectTypeOf(watch.getCurrentResult().dataState).toEqualTypeOf<'empty' | 'complete' | 'streaming' | 'partial'>();
  const operation = apollo.signal.query({ query });
  expectTypeOf(operation.result().dataState).toEqualTypeOf<'empty' | 'complete' | 'streaming' | 'partial'>();
  const complete = apollo.signal.query({ query, returnPartialData: false });
  expectTypeOf(complete.result().dataState).toEqualTypeOf<'empty' | 'complete' | 'streaming'>();
  expectTypeOf(apollo.signal.query.once({ query }).result().dataState).toEqualTypeOf<'empty' | 'complete'>();
});

test('a returnPartialData that is only known at runtime still admits partial', () => {
  const watch = apollo.watchQuery({ query, returnPartialData: includePartial });
  expectTypeOf(watch.getCurrentResult().dataState).toEqualTypeOf<'empty' | 'complete' | 'streaming' | 'partial'>();
  const operation = apollo.signal.query({ query, returnPartialData: includePartial });
  expectTypeOf(operation.result().dataState).toEqualTypeOf<'empty' | 'complete' | 'streaming' | 'partial'>();
});
