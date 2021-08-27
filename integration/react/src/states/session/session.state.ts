import { modifyQuery, state } from '@apollo-orbit/react';
import gql from 'graphql-tag';
import { Mutation, Query } from '../../graphql/types';
import { RefreshUserTokenDocument, SessionDocument, SessionQuery } from './gql/session';

const Toastify = require('toastify-js'); // eslint-disable-line @typescript-eslint/no-var-requires

const MAXIMUM_TOGGLES = 5;

const generateUserToken = () => Math.ceil(Math.random() * 1000);

export const sessionState = state(descriptor => descriptor
  .typeDefs(gql`
    type Session {
      currentUserToken: Int!
      refreshes: Int!
    }

    extend type Query {
      session: Session!
    }

    extend type Mutation {
      refreshUserToken: Int!
    }`)

  .resolver(
    ['Query', 'session'],
    (rootValue, args, context, info): Query['session'] => {
      return {
        __typename: 'Session',
        currentUserToken: generateUserToken(),
        refreshes: 0
      };
    })

  .resolver(
    ['Mutation', 'refreshUserToken'],
    (rootValue, args, { cache }, info): Mutation['refreshUserToken'] => {
      const { session, ...result } = cache.readQuery({ query: SessionDocument }) as SessionQuery;

      if (session.refreshes >= MAXIMUM_TOGGLES) {
        throw new Error('Maximum refreshes reached.');
      } else {
        cache.writeQuery({ query: SessionDocument, data: { ...result, session: { ...session, refreshes: session.refreshes + 1 } } });
      }

      return generateUserToken();
    })

  .mutationUpdate(RefreshUserTokenDocument, (cache, { data }): void => {
    if (!data) return;
    modifyQuery(cache, { query: SessionDocument }, query => query ? { session: { ...query.session, currentUserToken: data.refreshUserToken } } : query);
  })

  .effect(RefreshUserTokenDocument, result => {
    if (result.data) {
      Toastify({
        text: `User token was refreshed to ${result.data.refreshUserToken}`,
        duration: 3000,
        backgroundColor: 'linear-gradient(to right, #00b09b, #96c93d)'
      }).showToast();
    } else if (result.error) {
      Toastify({
        text: `Failed to refresh user token: ${result.error.message}`,
        duration: 3000,
        backgroundColor: 'linear-gradient(to right, #ff5f6d, #ffc371)'
      }).showToast();
    }
  })
);
