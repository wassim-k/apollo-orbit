import { Context } from '../context';
import { authorsContext } from './authors';
import { booksContext } from './books';

export const dbContext: Context = {
  books: booksContext,
  authors: authorsContext
};
