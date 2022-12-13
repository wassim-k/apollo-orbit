/* eslint-disable */
import * as _ from '../../../../graphql/types';

import { gql } from '@apollo-orbit/angular';
import { Context, PureQueryOptions, QueryObservable, TypedDocumentNode as DocumentNode } from '@apollo-orbit/angular';
export type LazyQueryVariables = _.Exact<{ [key: string]: never; }>;


export type LazyQueryData = { __typename?: 'Query', lazy: boolean };

export const LazyDocument = gql`
    query Lazy {
  lazy @client
}
    ` as DocumentNode<LazyQueryData, LazyQueryVariables>;

export class LazyQuery extends PureQueryOptions<LazyQueryData, LazyQueryVariables> {
  public constructor(context?: Context) {
    super(LazyDocument, undefined, context);
  }
}

export type LazyQueryObservable = QueryObservable<LazyQueryData, LazyQueryVariables>
