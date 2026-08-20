/* eslint-disable */
/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
import type * as Types from './types';

import { gql } from '@apollo/client';
import { TypedDocumentNode as DocumentNode } from '@apollo/client';
export type AuthorFragment = { __typename: 'Author', id: string, name: string };

export type AuthorWithBooksFragment = { __typename: 'Author', id: string, name: string, books: Array<BookFragment> | null };

export type AuthorsQueryVariables = Exact<{ [key: string]: never; }>;


export type AuthorsQueryData = { authors: Array<AuthorFragment> };

export type AuthorQueryVariables = Exact<{
  id: string | number;
}>;


export type AuthorQueryData = { author: AuthorFragment };

export type AddAuthorMutationVariables = Exact<{
  name: string;
  age?: number | null | undefined;
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
  book: Types.BookInput;
}>;


export type AddBookMutationData = { addBook: BookFragment };

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
  authors @client {
    ...AuthorFragment
  }
}
    ${AuthorFragmentDoc}` as DocumentNode<AuthorsQueryData, AuthorsQueryVariables>;
export const AUTHOR_QUERY = gql`
    query Author($id: ID!) {
  author(id: $id) @client {
    ...AuthorFragment
  }
}
    ${AuthorFragmentDoc}` as DocumentNode<AuthorQueryData, AuthorQueryVariables>;
export const ADD_AUTHOR_MUTATION = gql`
    mutation AddAuthor($name: String!, $age: Int) {
  addAuthor(name: $name, age: $age) {
    ...AuthorFragment
  }
}
    ${AuthorFragmentDoc}` as DocumentNode<AddAuthorMutationData, AddAuthorMutationVariables>;
export const BOOK_QUERY = gql`
    query Book($id: ID!) {
  book(id: $id) @client {
    ...BookFragment
  }
}
    ${BookFragmentDoc}` as DocumentNode<BookQueryData, BookQueryVariables>;
export const BOOKS_QUERY = gql`
    query Books($genre: String) {
  books(genre: $genre) @client {
    ...BookFragment
  }
}
    ${BookFragmentDoc}` as DocumentNode<BooksQueryData, BooksQueryVariables>;
export const ADD_BOOK_MUTATION = gql`
    mutation AddBook($book: BookInput!) {
  addBook(book: $book) @client {
    ...BookFragment
  }
}
    ${BookFragmentDoc}` as DocumentNode<AddBookMutationData, AddBookMutationVariables>;