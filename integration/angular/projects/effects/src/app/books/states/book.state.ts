import { Injectable } from '@angular/core';
import { ApolloCache, Effect, MutationUpdate, OptimisticResponse, Resolve, ResolverContext, ResolverInfo, State } from '@apollo-orbit/angular';
import { gql } from '@apollo/client/core';
import shortid from 'shortid';
import { Book } from '../../graphql';
import { Toastify } from '../../services/toastify.service';
import { AddBookMutation, AddBookMutationData, AddBookMutationInfo, AddBookMutationVariables, BooksQuery } from '../gql/book';

@Injectable()
@State({
  typeDefs: gql`
  extend type Book {
    displayName: String!
  }`
})
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
        name: book.name
      }
    };
  }

  @MutationUpdate(AddBookMutation)
  public addBook(cache: ApolloCache<any>, result: AddBookMutationInfo): void {
    const addBook = result.data?.addBook;
    if (!addBook) return;
    cache.updateQuery(new BooksQuery(), query => query ? { books: [...query.books, addBook] } : query);
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
