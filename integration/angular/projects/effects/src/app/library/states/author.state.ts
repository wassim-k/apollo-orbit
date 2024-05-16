import { identifyFragment, state } from '@apollo-orbit/angular';
import { AddBookMutation, AuthorFragmentDoc } from '../../graphql';

export const authorState = () => state(descriptor => descriptor
  .mutationUpdate(AddBookMutation, (cache, info) => {
    const addBook = info.data?.addBook;
    if (!addBook) return;
    const authorId = info.variables?.book.authorId as string;

    cache.updateFragment(
      identifyFragment(AuthorFragmentDoc, authorId),
      author => author ? ({ ...author, books: [...author.books, addBook] }) : author
    );
  })
);
