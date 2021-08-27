/* eslint-disable */
import gql from 'graphql-tag';
import { Context, MutationInfo, PureMutationOptions, PureQueryOptions, PureSubscriptionOptions, QueryObservable } from '@apollo-orbit/angular';
export type Maybe<T> = T | null;
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
  id: Scalars['ID'];
  name: Scalars['String'];
  books: Maybe<Array<Book>>;
};

export type AuthorInput = {
  name: Scalars['String'];
  age?: Maybe<Scalars['Int']>;
};

export type Book = {
  __typename?: 'Book';
  id: Scalars['ID'];
  name: Scalars['String'];
  genre: Maybe<Scalars['String']>;
  authorId: Scalars['ID'];
};

export type BookInput = {
  name: Scalars['String'];
  genre?: Maybe<Scalars['String']>;
  authorId: Scalars['ID'];
};

export type Mutation = {
  __typename?: 'Mutation';
  addBook: Book;
  addAuthor: Author;
};


export type MutationAddBookArgs = {
  book: BookInput;
};


export type MutationAddAuthorArgs = {
  author: AuthorInput;
};

export type Query = {
  __typename?: 'Query';
  authors: Array<Author>;
  author: Author;
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
  genre?: Maybe<Scalars['String']>;
};

export type Subscription = {
  __typename?: 'Subscription';
  newBook: Book;
};


export type SubscriptionNewBookArgs = {
  authorId?: Maybe<Scalars['ID']>;
};

export type AuthorFragment = { __typename: 'Author', id: string, name: string };

export type AuthorWithBooksFragment = { __typename: 'Author', id: string, name: string, books: Maybe<Array<{ __typename: 'Book', id: string, name: string, genre: Maybe<string>, authorId: string }>> };

export type AuthorsQueryVariables = Exact<{ [key: string]: never; }>;


export type AuthorsQueryData = { __typename?: 'Query', authors: Array<{ __typename: 'Author', id: string, name: string }> };

export type AuthorQueryVariables = Exact<{
  id: Scalars['ID'];
}>;


export type AuthorQueryData = { __typename?: 'Query', author: { __typename: 'Author', id: string, name: string } };

export type AddAuthorMutationVariables = Exact<{
  author: AuthorInput;
}>;


export type AddAuthorMutationData = { __typename?: 'Mutation', addAuthor: { __typename: 'Author', id: string, name: string } };

export type BookFragment = { __typename: 'Book', id: string, name: string, genre: Maybe<string>, authorId: string };

export type BookQueryVariables = Exact<{
  id: Scalars['ID'];
}>;


export type BookQueryData = { __typename?: 'Query', book: { __typename: 'Book', id: string, name: string, genre: Maybe<string>, authorId: string } };

export type BooksQueryVariables = Exact<{
  genre?: Maybe<Scalars['String']>;
}>;


export type BooksQueryData = { __typename?: 'Query', books: Array<{ __typename: 'Book', id: string, name: string, genre: Maybe<string>, authorId: string }> };

export type AddBookMutationVariables = Exact<{
  book: BookInput;
}>;


export type AddBookMutationData = { __typename?: 'Mutation', addBook: { __typename: 'Book', id: string, name: string, genre: Maybe<string>, authorId: string } };

export type NewBookByAuthorSubscriptionVariables = Exact<{
  id?: Maybe<Scalars['ID']>;
}>;


export type NewBookByAuthorSubscriptionData = { __typename?: 'Subscription', newBook: { __typename: 'Book', id: string, name: string, genre: Maybe<string>, authorId: string } };

export const AuthorFragmentDoc = gql`
    fragment AuthorFragment on Author {
  __typename
  id
  name
}
    `;
export const BookFragmentDoc = gql`
    fragment BookFragment on Book {
  __typename
  id
  name
  genre
  authorId
}
    `;
export const AuthorWithBooksFragmentDoc = gql`
    fragment AuthorWithBooksFragment on Author {
  __typename
  id
  name
  books {
    ...BookFragment
  }
}
    ${BookFragmentDoc}`;
export const AuthorsDocument = gql`
    query Authors {
  authors @client {
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

export const AuthorDocument = gql`
    query Author($id: ID!) {
  author(id: $id) @client {
    ...AuthorFragment
  }
}
    ${AuthorFragmentDoc}`;

export class AuthorQuery extends PureQueryOptions<AuthorQueryData, AuthorQueryVariables> {
  public constructor(variables: AuthorQueryVariables, context?: Context) {
    super(AuthorDocument, variables, context);
  }
}

export type AuthorQueryObservable = QueryObservable<AuthorQueryData, AuthorQueryVariables>

export const AddAuthorDocument = gql`
    mutation AddAuthor($author: AuthorInput!) {
  addAuthor(author: $author) @client {
    ...AuthorFragment
  }
}
    ${AuthorFragmentDoc}`;

export class AddAuthorMutation extends PureMutationOptions<AddAuthorMutationData, AddAuthorMutationVariables> {
  public constructor(variables: AddAuthorMutationVariables, context?: Context) {
    super(AddAuthorDocument, variables, context);
  }
}

export type AddAuthorMutationInfo = MutationInfo<AddAuthorMutationData, AddAuthorMutationVariables>

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

export const BooksDocument = gql`
    query Books($genre: String) {
  books(genre: $genre) @client {
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

export const AddBookDocument = gql`
    mutation AddBook($book: BookInput!) {
  addBook(book: $book) @client {
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
