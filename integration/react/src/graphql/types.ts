/* eslint-disable */
import { TypedDocumentNode as DocumentNode } from '@apollo/client';
import gql from 'graphql-tag';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
};

export type Author = {
  __typename?: 'Author';
  age: Maybe<Scalars['Int']>;
  books: Array<Book>;
  id: Scalars['ID'];
  name: Scalars['String'];
};

export type AuthorInput = {
  age?: InputMaybe<Scalars['Int']>;
  name: Scalars['String'];
};

export type Book = {
  __typename?: 'Book';
  author: Author;
  authorId: Scalars['ID'];
  displayName: Scalars['String'];
  genre: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  name: Scalars['String'];
};

export type BookInput = {
  authorId: Scalars['ID'];
  genre?: InputMaybe<Scalars['String']>;
  name: Scalars['String'];
};

export type Mutation = {
  __typename?: 'Mutation';
  addAuthor: Maybe<Author>;
  addBook: Maybe<Book>;
};


export type MutationAddAuthorArgs = {
  author: AuthorInput;
};


export type MutationAddBookArgs = {
  book: BookInput;
};

export type Query = {
  __typename?: 'Query';
  author: Author;
  authors: Array<Author>;
  book: Book;
  books: Array<Book>;
  lazy: Scalars['String'];
  theme: Theme;
};


export type QueryAuthorArgs = {
  id: Scalars['ID'];
};


export type QueryBookArgs = {
  id: Scalars['ID'];
};


export type QueryBooksArgs = {
  authorId?: InputMaybe<Scalars['ID']>;
  genre?: InputMaybe<Scalars['String']>;
  name?: InputMaybe<Scalars['String']>;
};

export type Subscription = {
  __typename?: 'Subscription';
  newAuthor: Author;
  newBook: Book;
};


export type SubscriptionNewBookArgs = {
  authorId?: InputMaybe<Scalars['ID']>;
};

export type Theme = {
  __typename?: 'Theme';
  displayName: Scalars['String'];
  name: ThemeName;
  toggles: Scalars['Int'];
};

export enum ThemeName {
  DarkTheme = 'DARK_THEME',
  LightTheme = 'LIGHT_THEME'
}

export type LazyQueryVariables = Exact<{ [key: string]: never; }>;


export type LazyQuery = { __typename?: 'Query', lazy: string };

export type AuthorFragment = { __typename?: 'Author', id: string, name: string, age: number | null, books: Array<(
    { __typename?: 'Book' }
    & BookFragment
  )> };

export type AuthorsQueryVariables = Exact<{ [key: string]: never; }>;


export type AuthorsQuery = { __typename?: 'Query', authors: Array<(
    { __typename?: 'Author' }
    & AuthorFragment
  )> };

export type AddAuthorMutationVariables = Exact<{
  author: AuthorInput;
}>;


export type AddAuthorMutation = { __typename?: 'Mutation', addAuthor: (
    { __typename?: 'Author' }
    & AuthorFragment
  ) | null };

export type NewAuthorSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type NewAuthorSubscription = { __typename?: 'Subscription', newAuthor: (
    { __typename?: 'Author' }
    & AuthorFragment
  ) };

export type BookFragment = { __typename?: 'Book', id: string, name: string, genre: string | null, displayName: string };

export type BooksQueryVariables = Exact<{
  name?: InputMaybe<Scalars['String']>;
  genre?: InputMaybe<Scalars['String']>;
  authorId?: InputMaybe<Scalars['ID']>;
}>;


export type BooksQuery = { __typename?: 'Query', books: Array<(
    { __typename?: 'Book' }
    & BookFragment
  )> };

export type BookQueryVariables = Exact<{
  id: Scalars['ID'];
}>;


export type BookQuery = { __typename?: 'Query', book: (
    { __typename?: 'Book' }
    & BookFragment
  ) };

export type AddBookMutationVariables = Exact<{
  book: BookInput;
}>;


export type AddBookMutation = { __typename?: 'Mutation', addBook: (
    { __typename?: 'Book' }
    & BookFragment
  ) | null };

export type NewBookSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type NewBookSubscription = { __typename?: 'Subscription', newBook: (
    { __typename?: 'Book' }
    & BookFragment
  ) };

export type NewBookByAuthorSubscriptionVariables = Exact<{
  id?: InputMaybe<Scalars['ID']>;
}>;


export type NewBookByAuthorSubscription = { __typename?: 'Subscription', newBook: (
    { __typename?: 'Book' }
    & BookFragment
  ) };

export type ThemeQueryVariables = Exact<{ [key: string]: never; }>;


export type ThemeQuery = { __typename?: 'Query', theme: { __typename?: 'Theme', name: ThemeName, toggles: number, displayName: string } };

export const BookFragmentDoc = gql`
    fragment BookFragment on Book {
  id
  name
  genre
  displayName @client
}
    ` as unknown as DocumentNode<BookFragment, unknown>;
export const AuthorFragmentDoc = gql`
    fragment AuthorFragment on Author {
  id
  name
  age
  books {
    ...BookFragment
  }
}
    ${BookFragmentDoc}` as unknown as DocumentNode<AuthorFragment, unknown>;
export const LazyDocument = gql`
    query Lazy {
  lazy @client
}
    ` as unknown as DocumentNode<LazyQuery, LazyQueryVariables>;
export const AuthorsDocument = gql`
    query Authors {
  authors {
    ...AuthorFragment
  }
}
    ${AuthorFragmentDoc}` as unknown as DocumentNode<AuthorsQuery, AuthorsQueryVariables>;
export const AddAuthorDocument = gql`
    mutation AddAuthor($author: AuthorInput!) {
  addAuthor(author: $author) {
    ...AuthorFragment
  }
}
    ${AuthorFragmentDoc}` as unknown as DocumentNode<AddAuthorMutation, AddAuthorMutationVariables>;
export const NewAuthorDocument = gql`
    subscription NewAuthor {
  newAuthor {
    ...AuthorFragment
  }
}
    ${AuthorFragmentDoc}` as unknown as DocumentNode<NewAuthorSubscription, NewAuthorSubscriptionVariables>;
export const BooksDocument = gql`
    query Books($name: String, $genre: String, $authorId: ID) {
  books(name: $name, genre: $genre, authorId: $authorId) {
    ...BookFragment
  }
}
    ${BookFragmentDoc}` as unknown as DocumentNode<BooksQuery, BooksQueryVariables>;
export const BookDocument = gql`
    query Book($id: ID!) {
  book(id: $id) {
    ...BookFragment
  }
}
    ${BookFragmentDoc}` as unknown as DocumentNode<BookQuery, BookQueryVariables>;
export const AddBookDocument = gql`
    mutation AddBook($book: BookInput!) {
  addBook(book: $book) {
    ...BookFragment
  }
}
    ${BookFragmentDoc}` as unknown as DocumentNode<AddBookMutation, AddBookMutationVariables>;
export const NewBookDocument = gql`
    subscription NewBook {
  newBook {
    ...BookFragment
  }
}
    ${BookFragmentDoc}` as unknown as DocumentNode<NewBookSubscription, NewBookSubscriptionVariables>;
export const NewBookByAuthorDocument = gql`
    subscription NewBookByAuthor($id: ID) {
  newBook(authorId: $id) {
    ...BookFragment
  }
}
    ${BookFragmentDoc}` as unknown as DocumentNode<NewBookByAuthorSubscription, NewBookByAuthorSubscriptionVariables>;
export const ThemeDocument = gql`
    query Theme {
  theme @client {
    name
    toggles
    displayName
  }
}
    ` as unknown as DocumentNode<ThemeQuery, ThemeQueryVariables>;