import shortid from 'shortid';
import { BookContext } from '../context.js';
import { AddBookInput, Book, UpdateBookInput } from '../types.js';
import { BookData, data } from './data.js';
import { applyFilters } from './utils/filter.js';

export const booksContext: BookContext = {
  addBook: (input: AddBookInput): Book => {
    const newBook: BookData = { id: shortid.generate(), authorId: input.authorId, genre: input.genre, name: input.name };
    data.books.push(newBook);
    return newBook as Book;
  },
  updateBook: (id: string, input: UpdateBookInput): Book => {
    const index = data.books.findIndex(b => b.id === id);

    if (index === -1) {
      throw new Error(`Book (id: ${id}) does not exist`);
    }

    data.books[index] = { ...data.books[index], genre: input.genre, name: input.name };

    return data.books[index] as Book;
  },
  getById: (id: string): Book => {
    return data.books.find(book => book.id === id) as Book;
  },
  getAll: (filter?: Partial<Pick<Book, 'authorId' | 'genre' | 'name'>>) => {
    return (
      filter
        ? data.books.filter(applyFilters(filter))
        : data.books
    ) as Array<Book>;
  }
};
