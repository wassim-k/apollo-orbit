/* eslint-disable */
import { gql } from '@apollo-orbit/angular';
import { TypedDocumentNode as DocumentNode } from '@apollo-orbit/angular';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
};

export type AddBookInput = {
  authorId: Scalars['ID']['input'];
  genre?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
};

export type Author = {
  __typename?: 'Author';
  age: Maybe<Scalars['Int']['output']>;
  books: Array<Book>;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
};

export type AuthorInput = {
  age?: InputMaybe<Scalars['Int']['input']>;
  name: Scalars['String']['input'];
};

export type Book = {
  __typename?: 'Book';
  author: Author;
  authorId: Scalars['ID']['output'];
  displayName: Scalars['String']['output'];
  genre: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
};

export type Mutation = {
  __typename?: 'Mutation';
  addAuthor: Author;
  addBook: Book;
  updateAuthor: Author;
  updateBook: Book;
};


export type MutationAddAuthorArgs = {
  author: AuthorInput;
};


export type MutationAddBookArgs = {
  book: AddBookInput;
};


export type MutationUpdateAuthorArgs = {
  author: AuthorInput;
  id: Scalars['ID']['input'];
};


export type MutationUpdateBookArgs = {
  book: UpdateBookInput;
  id: Scalars['ID']['input'];
};

export type Query = {
  __typename?: 'Query';
  author: Author;
  authors: Array<Author>;
  book: Book;
  books: Array<Book>;
  lazy: Scalars['Boolean']['output'];
  theme: Theme;
};


export type QueryAuthorArgs = {
  id: Scalars['ID']['input'];
};


export type QueryAuthorsArgs = {
  name?: InputMaybe<Scalars['String']['input']>;
};


export type QueryBookArgs = {
  id: Scalars['ID']['input'];
};


export type QueryBooksArgs = {
  authorId?: InputMaybe<Scalars['ID']['input']>;
  genre?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
};

export type Subscription = {
  __typename?: 'Subscription';
  newAuthor: Author;
  newBook: Book;
};


export type SubscriptionNewBookArgs = {
  authorId?: InputMaybe<Scalars['ID']['input']>;
};

export type Theme = {
  __typename?: 'Theme';
  displayName: Scalars['String']['output'];
  name: ThemeName;
  toggles: Scalars['Int']['output'];
};

export enum ThemeName {
  DarkTheme = 'DARK_THEME',
  LightTheme = 'LIGHT_THEME'
}

export type UpdateBookInput = {
  genre?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
};

export type LazyQueryVariables = Exact<{ [key: string]: never; }>;


export type LazyQueryData = { __typename?: 'Query', lazy: boolean };

export type AuthorFragment = { __typename?: 'Author', id: string, name: string, age: number | null, books: Array<(
    { __typename?: 'Book' }
    & BookFragment
  )> };

export type NewAuthorFragment = { __typename?: 'Author', id: string, name: string, age: number | null };

export type AuthorsQueryVariables = Exact<{
  name?: InputMaybe<Scalars['String']['input']>;
}>;


export type AuthorsQueryData = { __typename?: 'Query', authors: Array<(
    { __typename?: 'Author' }
    & AuthorFragment
  )> };

export type AddAuthorMutationVariables = Exact<{
  author: AuthorInput;
}>;


export type AddAuthorMutationData = { __typename?: 'Mutation', addAuthor: (
    { __typename?: 'Author' }
    & AuthorFragment
  ) };

export type UpdateAuthorMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  author: AuthorInput;
}>;


export type UpdateAuthorMutationData = { __typename?: 'Mutation', updateAuthor: (
    { __typename?: 'Author' }
    & AuthorFragment
  ) };

export type NewAuthorSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type NewAuthorSubscriptionData = { __typename?: 'Subscription', newAuthor: (
    { __typename?: 'Author' }
    & NewAuthorFragment
  ) };

export type BookFragment = { __typename?: 'Book', id: string, name: string, genre: string | null, authorId: string, displayName: string };

export type BooksQueryVariables = Exact<{
  name?: InputMaybe<Scalars['String']['input']>;
  genre?: InputMaybe<Scalars['String']['input']>;
  authorId?: InputMaybe<Scalars['ID']['input']>;
}>;


export type BooksQueryData = { __typename?: 'Query', books: Array<(
    { __typename?: 'Book' }
    & BookFragment
  )> };

export type BookQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type BookQueryData = { __typename?: 'Query', book: (
    { __typename?: 'Book' }
    & BookFragment
  ) };

export type AddBookMutationVariables = Exact<{
  book: AddBookInput;
}>;


export type AddBookMutationData = { __typename?: 'Mutation', addBook: (
    { __typename?: 'Book' }
    & BookFragment
  ) };

export type UpdateBookMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  book: UpdateBookInput;
}>;


export type UpdateBookMutationData = { __typename?: 'Mutation', updateBook: (
    { __typename?: 'Book' }
    & BookFragment
  ) };

export type NewBookSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type NewBookSubscriptionData = { __typename?: 'Subscription', newBook: (
    { __typename?: 'Book' }
    & BookFragment
  ) };

export type NewBookByAuthorSubscriptionVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type NewBookByAuthorSubscriptionData = { __typename?: 'Subscription', newBook: (
    { __typename?: 'Book' }
    & BookFragment
  ) };

export type ThemeQueryVariables = Exact<{ [key: string]: never; }>;


export type ThemeQueryData = { __typename?: 'Query', theme: { __typename?: 'Theme', name: ThemeName, toggles: number, displayName: string } };

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
    ${BookFragmentDoc}` as DocumentNode<AuthorFragment, unknown>;
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
    ${AuthorFragmentDoc}` as DocumentNode<AuthorsQueryData, AuthorsQueryVariables>;

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
    ${AuthorFragmentDoc}` as DocumentNode<AddAuthorMutationData, AddAuthorMutationVariables>;

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
    ${AuthorFragmentDoc}` as DocumentNode<UpdateAuthorMutationData, UpdateAuthorMutationVariables>;

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
