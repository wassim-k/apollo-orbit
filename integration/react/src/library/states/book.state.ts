import { state } from '@apollo-orbit/react';
import { gql } from '@apollo/client';
import shortid from 'shortid';
import { AddBookDocument, AddBookMutation, Book, BooksDocument } from '../../graphql';

const Toastify = require('toastify-js'); // eslint-disable-line @typescript-eslint/no-var-requires

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

  .mutationUpdate(AddBookDocument, (cache, info) => {
    const addBook = info.data?.addBook;
    if (!addBook) return;
    cache.updateQuery({ query: BooksDocument }, query => query ? { books: [...query.books, addBook] } : query);
  })

  .effect(AddBookDocument, info => {
    if (info.data?.addBook) {
      Toastify({
        text: `New book '${info.data.addBook.name}' was added.`,
        duration: 3000,
        backgroundColor: 'linear-gradient(to right, #00b09b, #96c93d)'
      }).showToast();
    } else if (info.error) {
      Toastify({
        text: `Failed to add book '${info.variables?.book.name}': ${info.error.message}`,
        duration: 3000,
        backgroundColor: 'linear-gradient(to right, #ff5f6d, #ffc371)'
      }).showToast();
    }
  })
);
