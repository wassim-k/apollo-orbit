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
  genre: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
};

export type LibraryRecord = Author | Book;

export type Mutation = {
  __typename?: 'Mutation';
  addAuthor: Author;
  addBook: Book;
  updateBook: Book;
};


export type MutationAddAuthorArgs = {
  author: AuthorInput;
};


export type MutationAddBookArgs = {
  book: AddBookInput;
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
  libraryRecords: Array<LibraryRecord>;
};


export type QueryAuthorArgs = {
  id: Scalars['ID']['input'];
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
  newBook: Book;
};


export type SubscriptionNewBookArgs = {
  authorId?: InputMaybe<Scalars['ID']['input']>;
};

export type UpdateBookInput = {
  genre?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
};

export type AuthorFragment = { __typename: 'Author', id: string, name: string };

export type AuthorWithBooksFragment = { __typename: 'Author', id: string, name: string, books: Array<(
    { __typename?: 'Book' }
    & BookFragment
  )> };

export type AuthorsQueryVariables = Exact<{ [key: string]: never; }>;


export type AuthorsQueryData = { __typename?: 'Query', authors: Array<(
    { __typename?: 'Author' }
    & AuthorFragment
  )> };

export type AuthorQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type AuthorQueryData = { __typename?: 'Query', author: (
    { __typename?: 'Author' }
    & AuthorFragment
  ) };

export type AddAuthorMutationVariables = Exact<{
  author: AuthorInput;
}>;


export type AddAuthorMutationData = { __typename?: 'Mutation', addAuthor: (
    { __typename?: 'Author' }
    & AuthorFragment
  ) };

export type BookFragment = { __typename: 'Book', id: string, name: string, genre: string | null, authorId: string };

export type BookQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type BookQueryData = { __typename?: 'Query', book: (
    { __typename?: 'Book' }
    & BookFragment
  ) };

export type BooksQueryVariables = Exact<{
  genre?: InputMaybe<Scalars['String']['input']>;
}>;


export type BooksQueryData = { __typename?: 'Query', books: Array<(
    { __typename?: 'Book' }
    & BookFragment
  )> };

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

export type NewBookByAuthorSubscriptionVariables = Exact<{
  id?: InputMaybe<Scalars['ID']['input']>;
}>;


export type NewBookByAuthorSubscriptionData = { __typename?: 'Subscription', newBook: (
    { __typename?: 'Book' }
    & BookFragment
  ) };

export type BooksClientQueryVariables = Exact<{
  genre?: InputMaybe<Scalars['String']['input']>;
}>;


export type BooksClientQueryData = { __typename?: 'Query', books: Array<(
    { __typename?: 'Book' }
    & BookFragment
  )> };

export type AddBookClientMutationVariables = Exact<{
  book: AddBookInput;
}>;


export type AddBookClientMutationData = { __typename?: 'Mutation', addBook: (
    { __typename?: 'Book' }
    & BookFragment
  ) };

export type AuthorsClientQueryVariables = Exact<{ [key: string]: never; }>;


export type AuthorsClientQueryData = { __typename?: 'Query', authors: Array<(
    { __typename?: 'Author' }
    & AuthorFragment
  )> };

export type AuthorClientQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type AuthorClientQueryData = { __typename?: 'Query', author: (
    { __typename?: 'Author' }
    & AuthorFragment
  ) };

export type LibraryRecordsQueryVariables = Exact<{ [key: string]: never; }>;


export type LibraryRecordsQueryData = { __typename?: 'Query', libraryRecords: Array<
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
    ${BookFragmentDoc}` as DocumentNode<AuthorWithBooksFragment, unknown>;
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
