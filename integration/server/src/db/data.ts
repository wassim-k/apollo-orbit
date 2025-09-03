import shortid from 'shortid';
import { Author, Book } from '../types.js';

export type BookData = Omit<Book, 'author'>;
export type AuthorData = Omit<Author, 'books'>;

export interface Data {
  books: Array<BookData>;
  authors: Array<AuthorData>;
}

const author1 = {
  id: shortid.generate(),
  age: 30,
  name: 'Author 1'
};

const author2 = {
  id: shortid.generate(),
  age: 31,
  name: 'Author 2'
};

export const data: Data = {
  books: [
    {
      id: shortid.generate(),
      authorId: author1.id,
      genre: 'Fiction',
      name: 'Book 1'
    },
    {
      id: shortid.generate(),
      authorId: author1.id,
      genre: 'Fiction',
      name: 'Book 2'
    },
    {
      id: shortid.generate(),
      authorId: author2.id,
      genre: 'Science Fiction',
      name: 'Book 3'
    }
  ],
  authors: [
    author1,
    author2
  ]
};
