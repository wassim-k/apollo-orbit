/* eslint-disable */
import * as _ from '../../../graphql/types';

import gql from 'graphql-tag';
import { Context, PureQueryOptions, QueryObservable } from '@apollo-orbit/angular';
export type ThemeQueryVariables = _.Exact<{ [key: string]: never; }>;


export type ThemeQueryData = { __typename?: 'Query', theme: { __typename?: 'Theme', name: _.ThemeName, toggles: number, displayName: string } };

export const ThemeDocument = gql`
    query Theme {
  theme @client {
    name
    toggles
    displayName
  }
}
    `;

export class ThemeQuery extends PureQueryOptions<ThemeQueryData, ThemeQueryVariables> {
  public constructor(context?: Context) {
    super(ThemeDocument, undefined, context);
  }
}

export type ThemeQueryObservable = QueryObservable<ThemeQueryData, ThemeQueryVariables>
