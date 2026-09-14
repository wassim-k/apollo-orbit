import { startWithLoading, type Apollo, type CacheQueryResult } from '@apollo-orbit/angular';
import type { TypedDocumentNode } from '@apollo/client';
import type { GraphQLCodegenIncremental } from '@apollo/client/incremental';
import { expectTypeOf } from 'expect-type';
import { test } from 'vitest';

declare module '@apollo/client' {
  interface TypeOverrides extends GraphQLCodegenIncremental.TypeOverrides { }
}

interface Greeting {
  greeting: { message: string } & ({ recipient?: never } | { recipient: { name: string } });
}
interface CompleteGreeting {
  greeting: { message: string; recipient: { name: string } };
}

declare const apollo: Apollo;
declare const query: TypedDocumentNode<Greeting, Record<string, never>>;
declare const cached: CacheQueryResult<Greeting>;

test('complete query results assemble deferred fields', () => {
  const result = apollo.signal.query({ query }).result();
  if (result.dataState === 'complete') {
    expectTypeOf(result.data).toEqualTypeOf<CompleteGreeting>();
  }
  if (result.dataState === 'streaming') {
    expectTypeOf(result.data).toEqualTypeOf<Greeting>();
  }
  const once = apollo.signal.query.once({ query }).result();
  if (once.dataState === 'complete') {
    expectTypeOf(once.data).toEqualTypeOf<CompleteGreeting>();
  }
  apollo.query({ query }).pipe(startWithLoading()).subscribe(result => {
    if (result.dataState === 'complete') {
      expectTypeOf(result.data).toEqualTypeOf<CompleteGreeting>();
    }
  });
});

test('complete cache results also assemble deferred fields', () => {
  if (cached.complete) {
    expectTypeOf(cached.data).toEqualTypeOf<CompleteGreeting>();
  }
  expectTypeOf(apollo.signal.cacheQuery.required({ query }).data()).toEqualTypeOf<CompleteGreeting>();
  apollo.cache.watchQuery.required({ query }).subscribe(result => {
    expectTypeOf(result.data).toEqualTypeOf<CompleteGreeting>();
  });
});
