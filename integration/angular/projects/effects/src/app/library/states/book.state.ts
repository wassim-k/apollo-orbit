import { inject } from '@angular/core';
import { state } from '@apollo-orbit/angular';
import { gql } from '@apollo/client/core';
import shortid from 'shortid';
import { AddBookMutation, Book } from '../../graphql';
import { Toastify } from '../../services/toastify.service';

export const bookState = () => {
  const toastify = inject(Toastify);

  return state(descriptor => descriptor
    .typeDefs(gql`
      extend type Book {
        displayName: String!
      }`
    )
    .resolver(['Book', 'displayName'], (rootValue: Book, args, context, info): Book['displayName'] => {
      return displayName(rootValue);
    })
    .optimisticResponse(AddBookMutation, ({ book }) => {
      return {
        __typename: 'Mutation' as const,
        addBook: {
          __typename: 'Book' as const,
          id: shortid.generate(),
          displayName: displayName(book as Book),
          genre: book.genre ?? null,
          name: book.name,
          authorId: book.authorId
        }
      };
    })
    .mutationUpdate(AddBookMutation, (cache, info) => {
      const addBook = info.data?.addBook;
      if (!addBook) return;
      cache.modify({
        id: 'ROOT_QUERY',
        fields: {
          books: (books, { toReference, fieldName, storeFieldName }) => {
            const args = JSON.parse(storeFieldName.substring(fieldName.length + 1, storeFieldName.length - 1));
            return args.name && args.name !== addBook.name
              ? books
              : [...books, toReference(addBook)];
          }
        }
      });
    })
    .effect(AddBookMutation, info => {
      if (info.data?.addBook) {
        toastify.success(`New book '${info.data.addBook.name}' was added successfully.`);
      } else if (info.error) {
        toastify.error(`Failed to add book '${info.variables?.book.name}': ${info.error.message}`);
      }
    }));
};

function displayName(book: Book): string {
  const { name, genre } = book;
  return typeof genre === 'string' ? `${name} (${genre})` : name;
}
