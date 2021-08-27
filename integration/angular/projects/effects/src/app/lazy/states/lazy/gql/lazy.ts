/* eslint-disable */
import * as _ from '../../../../graphql/types';

import gql from 'graphql-tag';
import { Context, PureQueryOptions, QueryObservable } from '@apollo-orbit/angular';
export type LazyQueryVariables = _.Exact<{ [key: string]: never; }>;


export type LazyQueryData = { __typename?: 'Query', lazy: boolean };

export const LazyDocument = gql`
    query Lazy {
  lazy @client
}
    `;

export class LazyQuery extends PureQueryOptions<LazyQueryData, LazyQueryVariables> {
  public constructor(context?: Context) {
    super(LazyDocument, undefined, context);
  }
}

export type LazyQueryObservable = QueryObservable<LazyQueryData, LazyQueryVariables>
