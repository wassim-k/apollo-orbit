/* eslint-disable */
import * as _ from '../../graphql/types';

import gql from 'graphql-tag';
import { Context, MutationInfo, PureMutationOptions, PureQueryOptions, PureSubscriptionOptions, QueryObservable } from '@apollo-orbit/angular';
export type BookFragment = { __typename: 'Book', id: string, name: string, genre: _.Maybe<string>, displayName: string };

export type BooksQueryVariables = _.Exact<{
  name?: _.Maybe<_.Scalars['String']>;
  genre?: _.Maybe<_.Scalars['String']>;
  authorId?: _.Maybe<_.Scalars['ID']>;
}>;


export type BooksQueryData = { __typename?: 'Query', books: Array<{ __typename: 'Book', id: string, name: string, genre: _.Maybe<string>, displayName: string }> };

export type BookQueryVariables = _.Exact<{
  id: _.Scalars['ID'];
}>;


export type BookQueryData = { __typename?: 'Query', book: { __typename: 'Book', id: string, name: string, genre: _.Maybe<string>, displayName: string } };

export type AddBookMutationVariables = _.Exact<{
  book: _.BookInput;
}>;


export type AddBookMutationData = { __typename?: 'Mutation', addBook: _.Maybe<{ __typename: 'Book', id: string, name: string, genre: _.Maybe<string>, displayName: string }> };

export type NewBookSubscriptionVariables = _.Exact<{ [key: string]: never; }>;


export type NewBookSubscriptionData = { __typename?: 'Subscription', newBook: { __typename: 'Book', id: string, name: string, genre: _.Maybe<string>, displayName: string } };

export type NewBookByAuthorSubscriptionVariables = _.Exact<{
  id?: _.Maybe<_.Scalars['ID']>;
}>;


export type NewBookByAuthorSubscriptionData = { __typename?: 'Subscription', newBook: { __typename: 'Book', id: string, name: string, genre: _.Maybe<string>, displayName: string } };

export const BookFragmentDoc = gql`
    fragment BookFragment on Book {
  __typename
  id
  name
  genre
  displayName @client
}
    `;
export const BooksDocument = gql`
    query Books($name: String, $genre: String, $authorId: ID) {
  books(name: $name, genre: $genre, authorId: $authorId) {
    ...BookFragment
  }
}
    ${BookFragmentDoc}`;

export class BooksQuery extends PureQueryOptions<BooksQueryData, BooksQueryVariables> {
  public constructor(variables?: BooksQueryVariables, context?: Context) {
    super(BooksDocument, variables, context);
  }
}

export type BooksQueryObservable = QueryObservable<BooksQueryData, BooksQueryVariables>

export const BookDocument = gql`
    query Book($id: ID!) {
  book(id: $id) {
    ...BookFragment
  }
}
    ${BookFragmentDoc}`;

export class BookQuery extends PureQueryOptions<BookQueryData, BookQueryVariables> {
  public constructor(variables: BookQueryVariables, context?: Context) {
    super(BookDocument, variables, context);
  }
}

export type BookQueryObservable = QueryObservable<BookQueryData, BookQueryVariables>

export const AddBookDocument = gql`
    mutation AddBook($book: BookInput!) {
  addBook(book: $book) {
    ...BookFragment
  }
}
    ${BookFragmentDoc}`;

export class AddBookMutation extends PureMutationOptions<AddBookMutationData, AddBookMutationVariables> {
  public constructor(variables: AddBookMutationVariables, context?: Context) {
    super(AddBookDocument, variables, context);
  }
}

export type AddBookMutationInfo = MutationInfo<AddBookMutationData, AddBookMutationVariables>

export const NewBookDocument = gql`
    subscription NewBook {
  newBook {
    ...BookFragment
  }
}
    ${BookFragmentDoc}`;

export class NewBookSubscription extends PureSubscriptionOptions<NewBookSubscriptionData, NewBookSubscriptionVariables> {
  public constructor() {
    super(NewBookDocument);
  }
}

export const NewBookByAuthorDocument = gql`
    subscription NewBookByAuthor($id: ID) {
  newBook(authorId: $id) {
    ...BookFragment
  }
}
    ${BookFragmentDoc}`;

export class NewBookByAuthorSubscription extends PureSubscriptionOptions<NewBookByAuthorSubscriptionData, NewBookByAuthorSubscriptionVariables> {
  public constructor(variables?: NewBookByAuthorSubscriptionVariables) {
    super(NewBookByAuthorDocument, variables);
  }
}
