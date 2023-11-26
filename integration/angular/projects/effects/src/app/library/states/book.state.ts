import { Injectable } from '@angular/core';
import { ApolloCache, Effect, MutationUpdate, OptimisticResponse, Resolve, ResolverContext, ResolverInfo } from '@apollo-orbit/angular';
import { gql } from '@apollo/client/core';
import shortid from 'shortid';
import { AddBookMutation, AddBookMutationData, AddBookMutationInfo, AddBookMutationVariables, Book } from '../../graphql';
import { Toastify } from '../../services/toastify.service';

@State({
  typeDefs: gql`
  extend type Book {
    displayName: String!
  }`
})
@Injectable()
export class BookState {
  public constructor(
    private readonly toastify: Toastify
  ) { }

  @Resolve(['Book', 'displayName'])
  public displayName(rootValue: Book, args?: any, context?: ResolverContext, info?: ResolverInfo): Book['displayName'] {
    const { name, genre } = rootValue;
    return typeof genre === 'string' ? `${name} (${genre})` : name;
  }

  @OptimisticResponse(AddBookMutation)
  public addBookResponse({ book }: AddBookMutationVariables): AddBookMutationData {
    return {
      __typename: 'Mutation',
      addBook: {
        __typename: 'Book',
        id: shortid.generate(),
        displayName: this.displayName(book as Book),
        genre: book.genre ?? null,
        name: book.name,
        authorId: book.authorId
      }
    };
  }

  @MutationUpdate(AddBookMutation)
  public addBook(cache: ApolloCache<any>, info: AddBookMutationInfo): void {
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
  }

  @Effect(AddBookMutation)
  public addBookEffect(info: AddBookMutationInfo): void {
    if (info.data?.addBook) {
      this.toastify.success(`New book '${info.data.addBook.name}' was added successfully.`);
    } else if (info.error) {
      this.toastify.error(`Failed to add book '${info.variables?.book.name}': ${info.error.message}`);
    }
  }
}
