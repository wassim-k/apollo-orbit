import { Injectable } from '@angular/core';
import { ApolloCache, modifyQuery, MutationUpdate, OptimisticResponse, Resolve, ResolverContext, ResolverInfo, State } from '@apollo-orbit/angular';
import { gql } from '@apollo/client/core';
import shortid from 'shortid';
import { Book } from '../../graphql';
import { AddBookMutation, AddBookMutationData, AddBookMutationInfo, AddBookMutationVariables, BooksQuery } from '../gql/book';

@State({
  typeDefs: gql`
  extend type Book {
    displayName: String!
  }`
})
@Injectable()
export class BookState {
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
    modifyQuery(cache, new BooksQuery(), query => query ? { books: [...query.books, addBook] } : query);
  }
}
