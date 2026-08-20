/* eslint-disable */
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
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
  books: Maybe<Array<Book>>;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
};

export type Book = {
  __typename?: 'Book';
  authorId: Scalars['ID']['output'];
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
};


export type MutationAddAuthorArgs = {
  age?: InputMaybe<Scalars['Int']['input']>;
  name: Scalars['String']['input'];
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
  id: Scalars['ID']['input'];
};


export type QueryBookArgs = {
  id: Scalars['ID']['input'];
};


export type QueryBooksArgs = {
  genre?: InputMaybe<Scalars['String']['input']>;
};
