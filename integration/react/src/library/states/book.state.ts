import { state } from '@apollo-orbit/react';
import { gql } from '@apollo/client';
import shortid from 'shortid';
import Toastify from 'toastify-js';
import { ADD_BOOK_MUTATION, Book, BOOKS_QUERY } from '../../graphql';

export const bookState = state(descriptor => descriptor
  .typeDefs(gql`
      extend type Book {
        displayName: String!
    }
  `)

  .typePolicies({
    Book: {
      fields: {
        displayName: (_existing, { readField }) => getDisplayName(readField<Book['name']>('name') as string, readField<Book['genre']>('genre'))
      }
    }
  })

  .optimisticResponse(ADD_BOOK_MUTATION, ({ book }) => ({
    __typename: 'Mutation' as const,
    addBook: {
      __typename: 'Book' as const,
      id: shortid.generate(),
      displayName: getDisplayName(book.name, book.genre),
      genre: book.genre ?? null,
      name: book.name,
      authorId: book.authorId
    }
  }))

  .mutationUpdate(ADD_BOOK_MUTATION, (cache, info) => {
    const addBook = info.data?.addBook;
    if (!addBook) return;
    cache.updateQuery({ query: BOOKS_QUERY }, data => data ? { books: [...data.books, addBook] } : data);
  })

  .effect(ADD_BOOK_MUTATION, info => {
    if (info.data?.addBook) {
      Toastify({
        text: `New book '${info.data.addBook.name}' was added.`,
        duration: 3000,
        style: {
          background: 'linear-gradient(to right, #00b09b, #96c93d)'
        }
      }).showToast();
    } else if (info.error) {
      Toastify({
        text: `Failed to add book '${info.variables?.book.name}': ${info.error.message}`,
        duration: 3000,
        style: {
          background: 'linear-gradient(to right, #ff5f6d, #ffc371)'
        }
      }).showToast();
    }
  })
);

function getDisplayName(name: string, genre: string | null | undefined): string {
  return typeof genre === 'string' ? `${name} (${genre})` : name;
}
