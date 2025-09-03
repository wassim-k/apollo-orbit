import { state } from '@apollo-orbit/react';
import { gql } from '@apollo/client';

export const lazyState = state(descriptor => descriptor
  .typeDefs(gql`
    extend type Query {
      lazy: Boolean!
    }
  `)
  .typePolicies({
    Query: {
      fields: {
        lazy: {
          read() {
            return true;
          }
        }
      }
    }
  })
);
