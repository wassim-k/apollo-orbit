import { identifyFragment, state } from '@apollo-orbit/react';
import { AddAuthorDocument, AddBookDocument, AuthorFragmentDoc, AuthorsDocument } from '../../graphql';

export const authorState = state(descriptor => descriptor
  .mutationUpdate(AddAuthorDocument, (cache, info) => {
    const addAuthor = info.data?.addAuthor;
    if (!addAuthor) return;
    cache.updateQuery({ query: AuthorsDocument }, query => query ? { authors: [...query.authors, addAuthor] } : query);
  })
  .mutationUpdate(AddBookDocument, (cache, info) => {
    const addBook = info.data?.addBook;
    if (!addBook) return;
    const authorId = info.variables?.book.authorId as string;

    cache.updateFragment(
      identifyFragment(AuthorFragmentDoc, authorId),
      author => author ? ({ ...author, books: [...author.books, addBook] }) : author
    );
  })
);
