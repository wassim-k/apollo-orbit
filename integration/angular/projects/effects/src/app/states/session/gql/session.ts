/* eslint-disable */
import * as _ from '../../../graphql/types';

import gql from 'graphql-tag';
import { Context, MutationInfo, PureMutationOptions, PureQueryOptions, QueryObservable } from '@apollo-orbit/angular';
export type SessionQueryVariables = _.Exact<{ [key: string]: never; }>;


export type SessionQueryData = { __typename?: 'Query', session: { __typename?: 'Session', theme: _.Theme, toggles: number } };

export type ToggleThemeMutationVariables = _.Exact<{
  force?: _.Maybe<_.Theme>;
}>;


export type ToggleThemeMutationData = { __typename?: 'Mutation', toggleTheme: _.Theme };

export const SessionDocument = gql`
    query Session {
  session @client {
    theme
    toggles
  }
}
    `;

export class SessionQuery extends PureQueryOptions<SessionQueryData, SessionQueryVariables> {
  public constructor(context?: Context) {
    super(SessionDocument, undefined, context);
  }
}

export type SessionQueryObservable = QueryObservable<SessionQueryData, SessionQueryVariables>

export const ToggleThemeDocument = gql`
    mutation ToggleTheme($force: Theme) {
  toggleTheme(force: $force) @client
}
    `;

export class ToggleThemeMutation extends PureMutationOptions<ToggleThemeMutationData, ToggleThemeMutationVariables> {
  public constructor(variables?: ToggleThemeMutationVariables, context?: Context) {
    super(ToggleThemeDocument, variables, context);
  }
}

export type ToggleThemeMutationInfo = MutationInfo<ToggleThemeMutationData, ToggleThemeMutationVariables>
