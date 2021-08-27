/* eslint-disable */
import * as _ from '../../graphql/types';

import gql from 'graphql-tag';
import { Context, PureMutationOptions, PureQueryOptions, PureSubscriptionOptions, QueryObservable } from '@apollo-orbit/angular/core';
export type AuthorFragment = { __typename: 'Author', id: string, name: string, age: _.Maybe<number> };

export type AuthorsQueryVariables = _.Exact<{ [key: string]: never; }>;


export type AuthorsQueryData = { __typename?: 'Query', authors: Array<{ __typename: 'Author', id: string, name: string, age: _.Maybe<number> }> };

export type AddAuthorMutationVariables = _.Exact<{
  author: _.AuthorInput;
}>;


export type AddAuthorMutationData = { __typename?: 'Mutation', addAuthor: _.Maybe<{ __typename: 'Author', id: string, name: string, age: _.Maybe<number> }> };

export type NewAuthorSubscriptionVariables = _.Exact<{ [key: string]: never; }>;


export type NewAuthorSubscriptionData = { __typename?: 'Subscription', newAuthor: { __typename: 'Author', id: string, name: string, age: _.Maybe<number> } };

export const AuthorFragmentDoc = gql`
    fragment AuthorFragment on Author {
  __typename
  id
  name
  age
}
    `;
export const AuthorsDocument = gql`
    query Authors {
  authors {
    ...AuthorFragment
  }
}
    ${AuthorFragmentDoc}`;

export class AuthorsQuery extends PureQueryOptions<AuthorsQueryData, AuthorsQueryVariables> {
  public constructor(context?: Context) {
    super(AuthorsDocument, undefined, context);
  }
}

export type AuthorsQueryObservable = QueryObservable<AuthorsQueryData, AuthorsQueryVariables>

export const AddAuthorDocument = gql`
    mutation AddAuthor($author: AuthorInput!) {
  addAuthor(author: $author) {
    ...AuthorFragment
  }
}
    ${AuthorFragmentDoc}`;

export class AddAuthorMutation extends PureMutationOptions<AddAuthorMutationData, AddAuthorMutationVariables> {
  public constructor(variables: AddAuthorMutationVariables, context?: Context) {
    super(AddAuthorDocument, variables, context);
  }
}

export const NewAuthorDocument = gql`
    subscription NewAuthor {
  newAuthor {
    ...AuthorFragment
  }
}
    ${AuthorFragmentDoc}`;

export class NewAuthorSubscription extends PureSubscriptionOptions<NewAuthorSubscriptionData, NewAuthorSubscriptionVariables> {
  public constructor() {
    super(NewAuthorDocument);
  }
}
