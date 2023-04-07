import { BaseContext } from '@apollo/server';
import { Author, AuthorInput, Book, BookInput, QueryBooksArgs } from './types';

export interface BookContext {
  getAll(filter?: QueryBooksArgs): Array<Book>;
  getById(id: string): Book;
  addBook(book: BookInput): Book;
}

export interface AuthorContext {
  getAll(filter?: Partial<Pick<Author, 'name' | 'age'>>): Array<Author>;
  getById(id: string): Author;
  addAuthor(author: AuthorInput): Author;
}

export interface Context extends BaseContext {
  authors: AuthorContext;
  books: BookContext;
}
