import type { Apollo, ApolloCacheEx, CacheQueryObservable, MutationOptions } from '@apollo-orbit/angular';
import { addStateToCache, MutationManager, state } from '@apollo-orbit/core';
import { InMemoryCache } from '@apollo/client';
import type { ApolloClient, TypedDocumentNode } from '@apollo/client';
import { expectTypeOf } from 'expect-type';
import { test } from 'vitest';
import { wrapMutate } from '../../../react/src/wrapMutate';

class AppCache extends InMemoryCache {
  public label(): string { return 'app'; }
}

declare module '@apollo/client' {
  interface TypeOverrides { cache: AppCache }
}

declare const apollo: Apollo;
declare const client: ApolloClient;
declare const mutation: TypedDocumentNode<{ value: string }, { id: string }>;

test('the Angular cache retains its implementation and Orbit extensions', () => {
  expectTypeOf(apollo.cache).toEqualTypeOf<ApolloCacheEx>();
  expectTypeOf(apollo.cache.label()).toEqualTypeOf<string>();
  expectTypeOf(apollo.cache.watchQuery).toBeFunction();
  expectTypeOf<ConstructorParameters<typeof CacheQueryObservable>[0]>().toEqualTypeOf<AppCache>();
  expectTypeOf(addStateToCache).parameter(0).toEqualTypeOf<AppCache>();
});

test('mutation callbacks receive the declared cache and defined variables', () => {
  const options: MutationOptions<{ value: string }, { id: string }> = {
    mutation,
    variables: { id: '1' },
    update(cache, _result, { variables }) {
      expectTypeOf(cache).toEqualTypeOf<AppCache>();
      expectTypeOf(variables).toEqualTypeOf<{ id: string }>();
    }
  };
  void apollo.mutate(options);
  void apollo.signal.mutation(mutation, options);
  void wrapMutate(new MutationManager(), client.mutate.bind(client))(options);
});

test('state initializers, updates and actions retain the declared cache', () => {
  state(descriptor => descriptor
    .onInit(cache => { expectTypeOf(cache).toEqualTypeOf<AppCache>(); })
    .mutationUpdate(mutation, cache => { expectTypeOf(cache).toEqualTypeOf<AppCache>(); })
    .action('inspect', (_action, { cache }) => { expectTypeOf(cache).toEqualTypeOf<AppCache>(); })
  );
});
