/* eslint-disable */
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
  age?: Maybe<Scalars['Int']>;
  books: Array<Book>;
};

export type AuthorInput = {
  name: Scalars['String'];
  age?: Maybe<Scalars['Int']>;
};

export type Book = {
  __typename?: 'Book';
  id: Scalars['ID'];
  name: Scalars['String'];
  genre?: Maybe<Scalars['String']>;
  author: Author;
  authorId: Scalars['ID'];
};

export type BookInput = {
  name: Scalars['String'];
  genre?: Maybe<Scalars['String']>;
  authorId: Scalars['ID'];
};

export type Mutation = {
  __typename?: 'Mutation';
  addAuthor?: Maybe<Author>;
  addBook?: Maybe<Book>;
};


export type MutationAddAuthorArgs = {
  author: AuthorInput;
};


export type MutationAddBookArgs = {
  book: BookInput;
};

export type Query = {
  __typename?: 'Query';
  book: Book;
  author: Author;
  authors: Array<Author>;
  books: Array<Book>;
};


export type QueryBookArgs = {
  id: Scalars['ID'];
};


export type QueryAuthorArgs = {
  id: Scalars['ID'];
};


export type QueryBooksArgs = {
  name?: Maybe<Scalars['String']>;
  genre?: Maybe<Scalars['String']>;
  authorId?: Maybe<Scalars['ID']>;
};

export type Subscription = {
  __typename?: 'Subscription';
  newBook: Book;
  newAuthor: Author;
};


export type SubscriptionNewBookArgs = {
  authorId?: Maybe<Scalars['ID']>;
};
