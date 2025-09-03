import { identifyFragment } from '@apollo-orbit/angular';
import { state } from '@apollo-orbit/angular/state';
import { ADD_BOOK_MUTATION, AuthorFragmentDoc } from '../../graphql';

export const authorState = () => state(descriptor => descriptor
  .mutationUpdate(ADD_BOOK_MUTATION, (cache, info) => {
    const addBook = info.data?.addBook;
    if (!addBook) return;
    const authorId = info.variables?.book.authorId as string;

    cache.updateFragment(
      identifyFragment(AuthorFragmentDoc, authorId),
      author => author ? ({ ...author, books: [...author.books, addBook] }) : author
    );
  })
);
