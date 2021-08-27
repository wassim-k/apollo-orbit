import { state } from '@apollo-orbit/react';
import { gql } from '@apollo/client';
import { Query } from '../../../graphql/types';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const lazyState = state(descriptor => descriptor
  .typeDefs(gql`
    extend type Query {
      lazy: String!
    }`)

  .resolver(
    ['Query', 'lazy'],
    (rootValue, args, context, info): Promise<Query['lazy']> => {
      return delay(2000).then(() => 'Loazy loaded');
    }
  )
);
