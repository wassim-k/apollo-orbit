/* eslint-disable */
import { gql } from '@apollo-orbit/angular/core';
import { Context, PureMutationOptions, PureQueryOptions, PureSubscriptionOptions, QueryObservable, TypedDocumentNode as DocumentNode } from '@apollo-orbit/angular/core';
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

export type AuthorFragment = { __typename?: 'Author', id: string, name: string, age: number | null };

export type AuthorsQueryVariables = Exact<{ [key: string]: never; }>;


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
  ) | null };

export type NewAuthorSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type NewAuthorSubscriptionData = { __typename?: 'Subscription', newAuthor: (
    { __typename?: 'Author' }
    & AuthorFragment
  ) };

export type BookFragment = { __typename?: 'Book', id: string, name: string, genre: string | null };

export type BooksQueryVariables = Exact<{
  name?: InputMaybe<Scalars['String']>;
  genre?: InputMaybe<Scalars['String']>;
  authorId?: InputMaybe<Scalars['ID']>;
}>;


export type BooksQueryData = { __typename?: 'Query', books: Array<(
    { __typename?: 'Book' }
    & BookFragment
  )> };

export type BookQueryVariables = Exact<{
  id: Scalars['ID'];
}>;


export type BookQueryData = { __typename?: 'Query', book: (
    { __typename?: 'Book' }
    & BookFragment
  ) };

export type AddBookMutationVariables = Exact<{
  book: BookInput;
}>;


export type AddBookMutationData = { __typename?: 'Mutation', addBook: (
    { __typename?: 'Book' }
    & BookFragment
  ) | null };

export type NewBookSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type NewBookSubscriptionData = { __typename?: 'Subscription', newBook: (
    { __typename?: 'Book' }
    & BookFragment
  ) };

export type NewBookByAuthorSubscriptionVariables = Exact<{
  id?: InputMaybe<Scalars['ID']>;
}>;


export type NewBookByAuthorSubscriptionData = { __typename?: 'Subscription', newBook: (
    { __typename?: 'Book' }
    & BookFragment
  ) };

export const AuthorFragmentDoc = gql`
    fragment AuthorFragment on Author {
  id
  name
  age
}
    ` as DocumentNode<AuthorFragment, unknown>;
export const BookFragmentDoc = gql`
    fragment BookFragment on Book {
  id
  name
  genre
}
    ` as DocumentNode<BookFragment, unknown>;
export const AuthorsDocument = gql`
    query Authors {
  authors {
    ...AuthorFragment
  }
}
    ${AuthorFragmentDoc}` as DocumentNode<AuthorsQueryData, AuthorsQueryVariables>;

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
    ${AuthorFragmentDoc}` as DocumentNode<AddAuthorMutationData, AddAuthorMutationVariables>;

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
    ${AuthorFragmentDoc}` as DocumentNode<NewAuthorSubscriptionData, NewAuthorSubscriptionVariables>;

export class NewAuthorSubscription extends PureSubscriptionOptions<NewAuthorSubscriptionData, NewAuthorSubscriptionVariables> {
  public constructor() {
    super(NewAuthorDocument);
  }
}

export const BooksDocument = gql`
    query Books($name: String, $genre: String, $authorId: ID) {
  books(name: $name, genre: $genre, authorId: $authorId) {
    ...BookFragment
  }
}
    ${BookFragmentDoc}` as DocumentNode<BooksQueryData, BooksQueryVariables>;

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
    ${BookFragmentDoc}` as DocumentNode<BookQueryData, BookQueryVariables>;

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
    ${BookFragmentDoc}` as DocumentNode<AddBookMutationData, AddBookMutationVariables>;

export class AddBookMutation extends PureMutationOptions<AddBookMutationData, AddBookMutationVariables> {
  public constructor(variables: AddBookMutationVariables, context?: Context) {
    super(AddBookDocument, variables, context);
  }
}

export const NewBookDocument = gql`
    subscription NewBook {
  newBook {
    ...BookFragment
  }
}
    ${BookFragmentDoc}` as DocumentNode<NewBookSubscriptionData, NewBookSubscriptionVariables>;

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
    ${BookFragmentDoc}` as DocumentNode<NewBookByAuthorSubscriptionData, NewBookByAuthorSubscriptionVariables>;

export class NewBookByAuthorSubscription extends PureSubscriptionOptions<NewBookByAuthorSubscriptionData, NewBookByAuthorSubscriptionVariables> {
  public constructor(variables?: NewBookByAuthorSubscriptionVariables) {
    super(NewBookByAuthorDocument, variables);
  }
}
