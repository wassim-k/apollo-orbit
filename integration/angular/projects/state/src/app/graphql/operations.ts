/* eslint-disable */
/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
import type * as Types from './types';

import { gql } from '@apollo-orbit/angular';
import { TypedDocumentNode as DocumentNode } from '@apollo-orbit/angular';
export type LazyQueryVariables = Exact<{ [key: string]: never; }>;


export type LazyQueryData = { lazy: boolean };

export type AuthorFragment = { id: string, name: string, age: number | null, books: Array<BookFragment> };

export type NewAuthorFragment = { id: string, name: string, age: number | null };

export type AuthorsQueryVariables = Exact<{
  name?: string | null | undefined;
}>;


export type AuthorsQueryData = { authors: Array<AuthorFragment> };

export type AddAuthorMutationVariables = Exact<{
  author: Types.AuthorInput;
}>;


export type AddAuthorMutationData = { addAuthor: AuthorFragment };

export type UpdateAuthorMutationVariables = Exact<{
  id: string | number;
  author: Types.AuthorInput;
}>;


export type UpdateAuthorMutationData = { updateAuthor: AuthorFragment };

export type NewAuthorSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type NewAuthorSubscriptionData = { newAuthor: NewAuthorFragment };

export type BookFragment = { id: string, name: string, genre: string | null, authorId: string, displayName: string };

export type BooksQueryVariables = Exact<{
  name?: string | null | undefined;
  genre?: string | null | undefined;
  authorId?: string | number | null | undefined;
}>;


export type BooksQueryData = { books: Array<BookFragment> };

export type BookQueryVariables = Exact<{
  id: string | number;
}>;


export type BookQueryData = { book: BookFragment };

export type AddBookMutationVariables = Exact<{
  book: Types.AddBookInput;
}>;


export type AddBookMutationData = { addBook: BookFragment };

export type UpdateBookMutationVariables = Exact<{
  id: string | number;
  book: Types.UpdateBookInput;
}>;


export type UpdateBookMutationData = { updateBook: BookFragment };

export type NewBookSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type NewBookSubscriptionData = { newBook: BookFragment };

export type NewBookByAuthorSubscriptionVariables = Exact<{
  id: string | number;
}>;


export type NewBookByAuthorSubscriptionData = { newBook: BookFragment };

export type ThemeQueryVariables = Exact<{ [key: string]: never; }>;


export type ThemeQueryData = { theme: { __typename: 'Theme', name: Types.ThemeName, toggles: number, displayName: string } };

export const BookFragmentDoc = gql`
    fragment BookFragment on Book {
  id
  name
  genre
  authorId
  displayName @client
}
    ` as DocumentNode<BookFragment, unknown>;
export const AuthorFragmentDoc = gql`
    fragment AuthorFragment on Author {
  id
  name
  age
  books {
    ...BookFragment
  }
}
    ` as DocumentNode<AuthorFragment, unknown>;
export const NewAuthorFragmentDoc = gql`
    fragment NewAuthorFragment on Author {
  id
  name
  age
}
    ` as DocumentNode<NewAuthorFragment, unknown>;
export const LAZY_QUERY = gql`
    query Lazy {
  lazy @client
}
    ` as DocumentNode<LazyQueryData, LazyQueryVariables>;

export function gqlLazyQuery(): { query: typeof LAZY_QUERY } {
  return {
    query: LAZY_QUERY
  };
}

export const AUTHORS_QUERY = gql`
    query Authors($name: String) {
  authors(name: $name) {
    ...AuthorFragment
  }
}
    ${AuthorFragmentDoc}
${BookFragmentDoc}` as DocumentNode<AuthorsQueryData, AuthorsQueryVariables>;

export function gqlAuthorsQuery(): { query: typeof AUTHORS_QUERY };
export function gqlAuthorsQuery(variables?: AuthorsQueryVariables): { query: typeof AUTHORS_QUERY, variables: typeof variables };
export function gqlAuthorsQuery(variables: () => AuthorsQueryVariables | undefined | null): { query: typeof AUTHORS_QUERY, variables: typeof variables };
export function gqlAuthorsQuery(variables?: any): any {
  return {
    query: AUTHORS_QUERY,
    variables
  };
}

export const ADD_AUTHOR_MUTATION = gql`
    mutation AddAuthor($author: AuthorInput!) {
  addAuthor(author: $author) {
    ...AuthorFragment
  }
}
    ${AuthorFragmentDoc}
${BookFragmentDoc}` as DocumentNode<AddAuthorMutationData, AddAuthorMutationVariables>;

export function gqlAddAuthorMutation(variables: AddAuthorMutationVariables): { mutation: typeof ADD_AUTHOR_MUTATION, variables: typeof variables } {
  return {
    mutation: ADD_AUTHOR_MUTATION,
    variables
  };
}

export const UPDATE_AUTHOR_MUTATION = gql`
    mutation UpdateAuthor($id: ID!, $author: AuthorInput!) {
  updateAuthor(id: $id, author: $author) {
    ...AuthorFragment
  }
}
    ${AuthorFragmentDoc}
${BookFragmentDoc}` as DocumentNode<UpdateAuthorMutationData, UpdateAuthorMutationVariables>;

export function gqlUpdateAuthorMutation(variables: UpdateAuthorMutationVariables): { mutation: typeof UPDATE_AUTHOR_MUTATION, variables: typeof variables } {
  return {
    mutation: UPDATE_AUTHOR_MUTATION,
    variables
  };
}

export const NEW_AUTHOR_SUBSCRIPTION = gql`
    subscription NewAuthor {
  newAuthor {
    ...NewAuthorFragment
  }
}
    ${NewAuthorFragmentDoc}` as DocumentNode<NewAuthorSubscriptionData, NewAuthorSubscriptionVariables>;

export function gqlNewAuthorSubscription(): { subscription: typeof NEW_AUTHOR_SUBSCRIPTION } {
  return {
    subscription: NEW_AUTHOR_SUBSCRIPTION
  };
}

export const BOOKS_QUERY = gql`
    query Books($name: String, $genre: String, $authorId: ID) {
  books(name: $name, genre: $genre, authorId: $authorId) {
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

export const NEW_BOOK_SUBSCRIPTION = gql`
    subscription NewBook {
  newBook {
    ...BookFragment
  }
}
    ${BookFragmentDoc}` as DocumentNode<NewBookSubscriptionData, NewBookSubscriptionVariables>;

export function gqlNewBookSubscription(): { subscription: typeof NEW_BOOK_SUBSCRIPTION } {
  return {
    subscription: NEW_BOOK_SUBSCRIPTION
  };
}

export const NEW_BOOK_BY_AUTHOR_SUBSCRIPTION = gql`
    subscription NewBookByAuthor($id: ID!) {
  newBook(authorId: $id) {
    ...BookFragment
  }
}
    ${BookFragmentDoc}` as DocumentNode<NewBookByAuthorSubscriptionData, NewBookByAuthorSubscriptionVariables>;

export function gqlNewBookByAuthorSubscription(variables: NewBookByAuthorSubscriptionVariables): { subscription: typeof NEW_BOOK_BY_AUTHOR_SUBSCRIPTION, variables: typeof variables };
export function gqlNewBookByAuthorSubscription(variables: () => NewBookByAuthorSubscriptionVariables | null): { subscription: typeof NEW_BOOK_BY_AUTHOR_SUBSCRIPTION, variables: typeof variables };
export function gqlNewBookByAuthorSubscription(variables: any): any {
  return {
    subscription: NEW_BOOK_BY_AUTHOR_SUBSCRIPTION,
    variables
  };
}

export const THEME_QUERY = gql`
    query Theme {
  theme @client {
    __typename
    name
    toggles
    displayName
  }
}
    ` as DocumentNode<ThemeQueryData, ThemeQueryVariables>;

export function gqlThemeQuery(): { query: typeof THEME_QUERY } {
  return {
    query: THEME_QUERY
  };
}
