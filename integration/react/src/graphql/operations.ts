/* eslint-disable */
/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
import type * as Types from './types';

import { gql } from '@apollo/client';
import { TypedDocumentNode as DocumentNode } from '@apollo/client';
export type LazyQueryVariables = Exact<{ [key: string]: never; }>;


export type LazyQuery = { lazy: boolean };

export type AuthorFragment = { id: string, name: string, age: number | null, books: Array<BookFragment> };

export type AuthorsQueryVariables = Exact<{ [key: string]: never; }>;


export type AuthorsQuery = { authors: Array<AuthorFragment> };

export type AddAuthorMutationVariables = Exact<{
  author: Types.AuthorInput;
}>;


export type AddAuthorMutation = { addAuthor: AuthorFragment };

export type NewAuthorSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type NewAuthorSubscription = { newAuthor: AuthorFragment };

export type BookFragment = { id: string, name: string, genre: string | null, authorId: string, displayName: string };

export type BooksQueryVariables = Exact<{
  name?: string | null | undefined;
  genre?: string | null | undefined;
  authorId?: string | number | null | undefined;
}>;


export type BooksQuery = { books: Array<BookFragment> };

export type BookQueryVariables = Exact<{
  id: string | number;
}>;


export type BookQuery = { book: BookFragment };

export type AddBookMutationVariables = Exact<{
  book: Types.AddBookInput;
}>;


export type AddBookMutation = { addBook: BookFragment };

export type NewBookSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type NewBookSubscription = { newBook: BookFragment };

export type NewBookByAuthorSubscriptionVariables = Exact<{
  id?: string | number | null | undefined;
}>;


export type NewBookByAuthorSubscription = { newBook: BookFragment };

export type ThemeQueryVariables = Exact<{ [key: string]: never; }>;


export type ThemeQuery = { theme: { __typename: 'Theme', name: Types.ThemeName, toggles: number, displayName: string } };

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
export const LAZY_QUERY = gql`
    query Lazy {
  lazy @client
}
    ` as DocumentNode<LazyQuery, LazyQueryVariables>;
export const AUTHORS_QUERY = gql`
    query Authors {
  authors {
    ...AuthorFragment
  }
}
    ${AuthorFragmentDoc}
${BookFragmentDoc}` as DocumentNode<AuthorsQuery, AuthorsQueryVariables>;
export const ADD_AUTHOR_MUTATION = gql`
    mutation AddAuthor($author: AuthorInput!) {
  addAuthor(author: $author) {
    ...AuthorFragment
  }
}
    ${AuthorFragmentDoc}
${BookFragmentDoc}` as DocumentNode<AddAuthorMutation, AddAuthorMutationVariables>;
export const NEW_AUTHOR_SUBSCRIPTION = gql`
    subscription NewAuthor {
  newAuthor {
    ...AuthorFragment
  }
}
    ${AuthorFragmentDoc}
${BookFragmentDoc}` as DocumentNode<NewAuthorSubscription, NewAuthorSubscriptionVariables>;
export const BOOKS_QUERY = gql`
    query Books($name: String, $genre: String, $authorId: ID) {
  books(name: $name, genre: $genre, authorId: $authorId) {
    ...BookFragment
  }
}
    ${BookFragmentDoc}` as DocumentNode<BooksQuery, BooksQueryVariables>;
export const BOOK_QUERY = gql`
    query Book($id: ID!) {
  book(id: $id) {
    ...BookFragment
  }
}
    ${BookFragmentDoc}` as DocumentNode<BookQuery, BookQueryVariables>;
export const ADD_BOOK_MUTATION = gql`
    mutation AddBook($book: AddBookInput!) {
  addBook(book: $book) {
    ...BookFragment
  }
}
    ${BookFragmentDoc}` as DocumentNode<AddBookMutation, AddBookMutationVariables>;
export const NEW_BOOK_SUBSCRIPTION = gql`
    subscription NewBook {
  newBook {
    ...BookFragment
  }
}
    ${BookFragmentDoc}` as DocumentNode<NewBookSubscription, NewBookSubscriptionVariables>;
export const NEW_BOOK_BY_AUTHOR_SUBSCRIPTION = gql`
    subscription NewBookByAuthor($id: ID) {
  newBook(authorId: $id) {
    ...BookFragment
  }
}
    ${BookFragmentDoc}` as DocumentNode<NewBookByAuthorSubscription, NewBookByAuthorSubscriptionVariables>;
export const THEME_QUERY = gql`
    query Theme {
  theme @client {
    __typename
    name
    toggles
    displayName
  }
}
    ` as DocumentNode<ThemeQuery, ThemeQueryVariables>;