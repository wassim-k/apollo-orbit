import { Injectable } from '@angular/core';
import { ApolloCache, MutationUpdate, State, identifyFragment } from '@apollo-orbit/angular';
import { AddBookMutation, AddBookMutationInfo, AuthorFragmentDoc } from '../../graphql';

@State()
@Injectable()
export class AuthorState {
  @MutationUpdate(AddBookMutation)
  public addBook(cache: ApolloCache<any>, info: AddBookMutationInfo): void {
    const addBook = info.data?.addBook;
    if (!addBook) return;
    const authorId = info.variables?.book.authorId as string;

    cache.updateFragment(
      identifyFragment(AuthorFragmentDoc, authorId),
      author => author ? ({ ...author, books: [...author.books, addBook] }) : author
    );
  }
}
