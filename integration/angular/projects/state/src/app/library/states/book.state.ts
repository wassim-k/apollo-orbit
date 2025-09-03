import { inject } from '@angular/core';
import { state } from '@apollo-orbit/angular/state';
import { gql } from '@apollo/client';
import shortid from 'shortid';
import { ADD_BOOK_MUTATION, Book } from '../../graphql';
import { Toastify } from '../../services/toastify.service';

export const bookState = () => {
  const toastify = inject(Toastify);

  return state(descriptor => descriptor
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
    .optimisticResponse(ADD_BOOK_MUTATION, ({ book }) => {
      return {
        __typename: 'Mutation' as const,
        addBook: {
          __typename: 'Book' as const,
          id: shortid.generate(),
          displayName: getDisplayName(book.name, book.genre),
          genre: book.genre ?? null,
          name: book.name,
          authorId: book.authorId
        }
      };
    })
    .mutationUpdate(ADD_BOOK_MUTATION, (cache, info) => {
      const addBook = info.data?.addBook;
      if (!addBook) return;
      cache.modify({
        id: 'ROOT_QUERY',
        fields: {
          books: (books, { toReference, fieldName, storeFieldName }) => {
            const args = fieldName !== storeFieldName
              ? JSON.parse(storeFieldName.substring(fieldName.length + 1, storeFieldName.length - 1))
              : {};
            return args.name && args.name !== addBook.name
              ? books
              : [...books, toReference(addBook)];
          }
        }
      });
    })
    .effect(ADD_BOOK_MUTATION, info => {
      if (info.data?.addBook) {
        toastify.success(`New book '${info.data.addBook.name}' was added successfully.`);
      } else if (info.error) {
        toastify.error(`Failed to add book '${info.variables?.book.name}': ${info.error.message}`);
      }
    }));
};

function getDisplayName(name: string, genre: string | null | undefined): string {
  return typeof genre === 'string' ? `${name} (${genre})` : name;
}
