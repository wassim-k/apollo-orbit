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
