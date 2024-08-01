import { gql, state } from '@apollo-orbit/angular';
import { timer } from 'rxjs';
import { map } from 'rxjs/operators';

export const lazyState = () => state(descriptor => descriptor
  .typeDefs(gql`
    extend type Query {
      lazy: Boolean!
    }
  `)
  .resolver(['Query', 'lazy'], (rootValue, args, context, info) => {
    return timer(2000).pipe(map(() => true));
  })
);
