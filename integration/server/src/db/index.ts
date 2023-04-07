import { Context } from '../context.js';
import { authorsContext } from './authors.js';
import { booksContext } from './books.js';

export const dbContext: Context = {
  books: booksContext,
  authors: authorsContext
};
