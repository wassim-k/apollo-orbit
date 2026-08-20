/* eslint-disable */
/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
import type * as Types from './types';

import { gql } from '@apollo-orbit/angular';
import { TypedDocumentNode as DocumentNode } from '@apollo-orbit/angular';
export type AuthorFragment = { __typename: 'Author', id: string, name: string };

export type AuthorWithBooksFragment = { __typename: 'Author', id: string, name: string, books: Array<BookFragment> };

export type AuthorsQueryVariables = Exact<{ [key: string]: never; }>;


export type AuthorsQueryData = { authors: Array<AuthorFragment> };

export type AuthorQueryVariables = Exact<{
  id: string | number;
}>;


export type AuthorQueryData = { author: AuthorFragment };

export type AddAuthorMutationVariables = Exact<{
  author: Types.AuthorInput;
}>;


export type AddAuthorMutationData = { addAuthor: AuthorFragment };

export type BookFragment = { __typename: 'Book', id: string, name: string, genre: string | null, authorId: string };

export type BookQueryVariables = Exact<{
  id: string | number;
}>;


export type BookQueryData = { book: BookFragment };

export type BooksQueryVariables = Exact<{
  genre?: string | null | undefined;
}>;


export type BooksQueryData = { books: Array<BookFragment> };

export type AddBookMutationVariables = Exact<{
  book: Types.AddBookInput;
}>;


export type AddBookMutationData = { addBook: BookFragment };

export type UpdateBookMutationVariables = Exact<{
  id: string | number;
  book: Types.UpdateBookInput;
}>;


export type UpdateBookMutationData = { updateBook: BookFragment };

export type NewBookByAuthorSubscriptionVariables = Exact<{
  id?: string | number | null | undefined;
}>;


export type NewBookByAuthorSubscriptionData = { newBook: BookFragment };

export type BooksClientQueryVariables = Exact<{
  genre?: string | null | undefined;
}>;


export type BooksClientQueryData = { books: Array<BookFragment> };

export type AddBookClientMutationVariables = Exact<{
  book: Types.AddBookInput;
}>;


export type AddBookClientMutationData = { addBook: BookFragment };

export type AuthorsClientQueryVariables = Exact<{ [key: string]: never; }>;


export type AuthorsClientQueryData = { authors: Array<AuthorFragment> };

export type AuthorClientQueryVariables = Exact<{
  id: string | number;
}>;


export type AuthorClientQueryData = { author: AuthorFragment };

export type LibraryRecordsQueryVariables = Exact<{ [key: string]: never; }>;


export type LibraryRecordsQueryData = { libraryRecords: Array<
    | (
      { __typename: 'Author' }
      & AuthorFragment
    )
    | (
      { __typename: 'Book' }
      & BookFragment
    )
  > };

export const AuthorFragmentDoc = gql`
    fragment AuthorFragment on Author {
  __typename
  id
  name
}
    ` as DocumentNode<AuthorFragment, unknown>;
export const BookFragmentDoc = gql`
    fragment BookFragment on Book {
  __typename
  id
  name
  genre
  authorId
}
    ` as DocumentNode<BookFragment, unknown>;
export const AuthorWithBooksFragmentDoc = gql`
    fragment AuthorWithBooksFragment on Author {
  __typename
  id
  name
  books {
    ...BookFragment
  }
}
    ` as DocumentNode<AuthorWithBooksFragment, unknown>;
export const AUTHORS_QUERY = gql`
    query Authors {
  authors {
    ...AuthorFragment
  }
}
    ${AuthorFragmentDoc}` as DocumentNode<AuthorsQueryData, AuthorsQueryVariables>;

export function gqlAuthorsQuery(): { query: typeof AUTHORS_QUERY } {
  return {
    query: AUTHORS_QUERY
  };
}

export const AUTHOR_QUERY = gql`
    query Author($id: ID!) {
  author(id: $id) {
    ...AuthorFragment
  }
}
    ${AuthorFragmentDoc}` as DocumentNode<AuthorQueryData, AuthorQueryVariables>;

export function gqlAuthorQuery(variables: AuthorQueryVariables): { query: typeof AUTHOR_QUERY, variables: typeof variables };
export function gqlAuthorQuery(variables: () => AuthorQueryVariables | null): { query: typeof AUTHOR_QUERY, variables: typeof variables };
export function gqlAuthorQuery(variables: any): any {
  return {
    query: AUTHOR_QUERY,
    variables
  };
}

export const ADD_AUTHOR_MUTATION = gql`
    mutation AddAuthor($author: AuthorInput!) {
  addAuthor(author: $author) {
    ...AuthorFragment
  }
}
    ${AuthorFragmentDoc}` as DocumentNode<AddAuthorMutationData, AddAuthorMutationVariables>;

export function gqlAddAuthorMutation(variables: AddAuthorMutationVariables): { mutation: typeof ADD_AUTHOR_MUTATION, variables: typeof variables } {
  return {
    mutation: ADD_AUTHOR_MUTATION,
    variables
  };
}

export const BOOK_QUERY = gql`
    query Book($id: ID!) {
  book(id: $id) {
    ...BookFragment
  }
}
    ${BookFragmentDoc}` as DocumentNode<BookQueryData, BookQueryVariables>;

export function gqlBookQuery(variables: BookQueryVariables): { query: typeof BOOK_QUERY, variables: typeof variables };
export function gqlBookQuery(variables: () => BookQueryVariables | null): { query: typeof BOOK_QUERY, variables: typeof variables };
export function gqlBookQuery(variables: any): any {
  return {
    query: BOOK_QUERY,
    variables
  };
}

export const BOOKS_QUERY = gql`
    query Books($genre: String) {
  books(genre: $genre) {
    ...BookFragment
  }
}
    ${BookFragmentDoc}` as DocumentNode<BooksQueryData, BooksQueryVariables>;

export function gqlBooksQuery(): { query: typeof BOOKS_QUERY };
export function gqlBooksQuery(variables?: BooksQueryVariables): { query: typeof BOOKS_QUERY, variables: typeof variables };
export function gqlBooksQuery(variables: () => BooksQueryVariables | undefined | null): { query: typeof BOOKS_QUERY, variables: typeof variables };
export function gqlBooksQuery(variables?: any): any {
  return {
    query: BOOKS_QUERY,
    variables
  };
}

export const ADD_BOOK_MUTATION = gql`
    mutation AddBook($book: AddBookInput!) {
  addBook(book: $book) {
    ...BookFragment
  }
}
    ${BookFragmentDoc}` as DocumentNode<AddBookMutationData, AddBookMutationVariables>;

export function gqlAddBookMutation(variables: AddBookMutationVariables): { mutation: typeof ADD_BOOK_MUTATION, variables: typeof variables } {
  return {
    mutation: ADD_BOOK_MUTATION,
    variables
  };
}

export const UPDATE_BOOK_MUTATION = gql`
    mutation UpdateBook($id: ID!, $book: UpdateBookInput!) {
  updateBook(id: $id, book: $book) {
    ...BookFragment
  }
}
    ${BookFragmentDoc}` as DocumentNode<UpdateBookMutationData, UpdateBookMutationVariables>;

export function gqlUpdateBookMutation(variables: UpdateBookMutationVariables): { mutation: typeof UPDATE_BOOK_MUTATION, variables: typeof variables } {
  return {
    mutation: UPDATE_BOOK_MUTATION,
    variables
  };
}

export const NEW_BOOK_BY_AUTHOR_SUBSCRIPTION = gql`
    subscription NewBookByAuthor($id: ID) {
  newBook(authorId: $id) {
    ...BookFragment
  }
}
    ${BookFragmentDoc}` as DocumentNode<NewBookByAuthorSubscriptionData, NewBookByAuthorSubscriptionVariables>;

export function gqlNewBookByAuthorSubscription(): { subscription: typeof NEW_BOOK_BY_AUTHOR_SUBSCRIPTION };
export function gqlNewBookByAuthorSubscription(variables?: NewBookByAuthorSubscriptionVariables): { subscription: typeof NEW_BOOK_BY_AUTHOR_SUBSCRIPTION, variables: typeof variables };
export function gqlNewBookByAuthorSubscription(variables: () => NewBookByAuthorSubscriptionVariables | undefined | null): { subscription: typeof NEW_BOOK_BY_AUTHOR_SUBSCRIPTION, variables: typeof variables };
export function gqlNewBookByAuthorSubscription(variables?: any): any {
  return {
    subscription: NEW_BOOK_BY_AUTHOR_SUBSCRIPTION,
    variables
  };
}

export const BOOKS_CLIENT_QUERY = gql`
    query BooksClient($genre: String) {
  books(genre: $genre) @client {
    ...BookFragment
  }
}
    ${BookFragmentDoc}` as DocumentNode<BooksClientQueryData, BooksClientQueryVariables>;

export function gqlBooksClientQuery(): { query: typeof BOOKS_CLIENT_QUERY };
export function gqlBooksClientQuery(variables?: BooksClientQueryVariables): { query: typeof BOOKS_CLIENT_QUERY, variables: typeof variables };
export function gqlBooksClientQuery(variables: () => BooksClientQueryVariables | undefined | null): { query: typeof BOOKS_CLIENT_QUERY, variables: typeof variables };
export function gqlBooksClientQuery(variables?: any): any {
  return {
    query: BOOKS_CLIENT_QUERY,
    variables
  };
}

export const ADD_BOOK_CLIENT_MUTATION = gql`
    mutation AddBookClient($book: AddBookInput!) {
  addBook(book: $book) @client {
    ...BookFragment
  }
}
    ${BookFragmentDoc}` as DocumentNode<AddBookClientMutationData, AddBookClientMutationVariables>;

export function gqlAddBookClientMutation(variables: AddBookClientMutationVariables): { mutation: typeof ADD_BOOK_CLIENT_MUTATION, variables: typeof variables } {
  return {
    mutation: ADD_BOOK_CLIENT_MUTATION,
    variables
  };
}

export const AUTHORS_CLIENT_QUERY = gql`
    query AuthorsClient {
  authors @client {
    ...AuthorFragment
  }
}
    ${AuthorFragmentDoc}` as DocumentNode<AuthorsClientQueryData, AuthorsClientQueryVariables>;

export function gqlAuthorsClientQuery(): { query: typeof AUTHORS_CLIENT_QUERY } {
  return {
    query: AUTHORS_CLIENT_QUERY
  };
}

export const AUTHOR_CLIENT_QUERY = gql`
    query AuthorClient($id: ID!) {
  author(id: $id) @client {
    ...AuthorFragment
  }
}
    ${AuthorFragmentDoc}` as DocumentNode<AuthorClientQueryData, AuthorClientQueryVariables>;

export function gqlAuthorClientQuery(variables: AuthorClientQueryVariables): { query: typeof AUTHOR_CLIENT_QUERY, variables: typeof variables };
export function gqlAuthorClientQuery(variables: () => AuthorClientQueryVariables | null): { query: typeof AUTHOR_CLIENT_QUERY, variables: typeof variables };
export function gqlAuthorClientQuery(variables: any): any {
  return {
    query: AUTHOR_CLIENT_QUERY,
    variables
  };
}

export const LIBRARY_RECORDS_QUERY = gql`
    query LibraryRecords {
  libraryRecords @client {
    __typename
    ... on Book {
      ...BookFragment
    }
    ... on Author {
      ...AuthorFragment
    }
  }
}
    ${BookFragmentDoc}
${AuthorFragmentDoc}` as DocumentNode<LibraryRecordsQueryData, LibraryRecordsQueryVariables>;

export function gqlLibraryRecordsQuery(): { query: typeof LIBRARY_RECORDS_QUERY } {
  return {
    query: LIBRARY_RECORDS_QUERY
  };
}
