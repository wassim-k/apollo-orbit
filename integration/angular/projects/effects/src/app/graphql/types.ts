/* eslint-disable */
import { gql } from '@apollo-orbit/angular';
import { Context, MutationInfo, PureMutationOptions, PureQueryOptions, PureSubscriptionOptions, QueryObservable, TypedDocumentNode as DocumentNode } from '@apollo-orbit/angular';
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

export type BookInput = {
  authorId: Scalars['ID']['input'];
  genre?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
};

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
  book: BookInput;
};


export type MutationUpdateBookArgs = {
  book: BookInput;
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

export type LazyQueryVariables = Exact<{ [key: string]: never; }>;


export type LazyQueryData = { __typename?: 'Query', lazy: boolean };

export type AuthorFragment = { __typename?: 'Author', id: string, name: string, age: number | null, books: Array<(
    { __typename?: 'Book' }
    & BookFragment
  )> };

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
  ) };

export type NewAuthorSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type NewAuthorSubscriptionData = { __typename?: 'Subscription', newAuthor: (
    { __typename?: 'Author' }
    & AuthorFragment
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
  book: BookInput;
}>;


export type AddBookMutationData = { __typename?: 'Mutation', addBook: (
    { __typename?: 'Book' }
    & BookFragment
  ) };

export type UpdateBookMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  book: BookInput;
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
  id?: InputMaybe<Scalars['ID']['input']>;
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
export const LazyDocument = gql`
    query Lazy {
  lazy @client
}
    ` as DocumentNode<LazyQueryData, LazyQueryVariables>;

export class LazyQuery extends PureQueryOptions<LazyQueryData, LazyQueryVariables> {
  public constructor(context?: Context) {
    super(LazyDocument, undefined, context);
  }
}

export type LazyQueryObservable = QueryObservable<LazyQueryData, LazyQueryVariables>

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

export type AddAuthorMutationInfo = MutationInfo<AddAuthorMutationData, AddAuthorMutationVariables>

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

export type AddBookMutationInfo = MutationInfo<AddBookMutationData, AddBookMutationVariables>

export const UpdateBookDocument = gql`
    mutation UpdateBook($id: ID!, $book: BookInput!) {
  updateBook(id: $id, book: $book) {
    ...BookFragment
  }
}
    ${BookFragmentDoc}` as DocumentNode<UpdateBookMutationData, UpdateBookMutationVariables>;

export class UpdateBookMutation extends PureMutationOptions<UpdateBookMutationData, UpdateBookMutationVariables> {
  public constructor(variables: UpdateBookMutationVariables, context?: Context) {
    super(UpdateBookDocument, variables, context);
  }
}

export type UpdateBookMutationInfo = MutationInfo<UpdateBookMutationData, UpdateBookMutationVariables>

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

export const ThemeDocument = gql`
    query Theme {
  theme @client {
    name
    toggles
    displayName
  }
}
    ` as DocumentNode<ThemeQueryData, ThemeQueryVariables>;

export class ThemeQuery extends PureQueryOptions<ThemeQueryData, ThemeQueryVariables> {
  public constructor(context?: Context) {
    super(ThemeDocument, undefined, context);
  }
}

export type ThemeQueryObservable = QueryObservable<ThemeQueryData, ThemeQueryVariables>
