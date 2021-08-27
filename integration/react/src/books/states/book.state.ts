import { modifyQuery, state } from '@apollo-orbit/react';
import { gql } from '@apollo/client';
import shortid from 'shortid';
import { Book } from '../../graphql/types';
import { AddBookDocument, AddBookMutation, BooksDocument } from '../api/book';

const getDisplayName = (book: Book) => {
  const { name, genre } = book;
  return typeof genre === 'string' ? `${name} (${genre})` : name;
};

export const bookState = state(descriptor => descriptor
  .typeDefs(gql`
      extend type Book {
        displayName: String!
    }`)

  .resolver(
    ['Book', 'displayName'],
    (rootValue: Book, args, context, info): Book['displayName'] => {
      return getDisplayName(rootValue);
    })

  .optimisticResponse(AddBookDocument, ({ book }): AddBookMutation => ({
    __typename: 'Mutation',
    addBook: {
      __typename: 'Book',
      id: shortid.generate(),
      displayName: getDisplayName(book as Book),
      genre: book.genre ?? null,
      name: book.name
    }
  }))

  .mutationUpdate(AddBookDocument, (cache, result) => {
    const addBook = result.data?.addBook;
    if (!addBook) return;
    modifyQuery(cache, { query: BooksDocument }, query => query ? { books: [...query.books, addBook] } : query);
  })
);
