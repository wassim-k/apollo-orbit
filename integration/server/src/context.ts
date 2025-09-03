import { BaseContext } from '@apollo/server';
import { AddBookInput, Author, AuthorInput, Book, QueryAuthorsArgs, QueryBooksArgs, UpdateBookInput } from './types.js';

export interface BookContext {
  getAll(filter?: QueryBooksArgs): Array<Book>;
  getById(id: string): Book;
  addBook(book: AddBookInput): Book;
  updateBook(id: string, book: UpdateBookInput): Book;
}

export interface AuthorContext {
  getAll(filter?: QueryAuthorsArgs): Array<Author>;
  getById(id: string): Author;
  addAuthor(author: AuthorInput): Author;
  updateAuthor(id: string, input: AuthorInput): Author;
}

export interface Context extends BaseContext {
  authors: AuthorContext;
  books: BookContext;
}
