import { gql } from '@apollo-orbit/angular';
import { state } from '@apollo-orbit/angular/state';

export const lazyState = () => state(descriptor => descriptor
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
