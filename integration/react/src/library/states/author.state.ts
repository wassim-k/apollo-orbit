import { state } from '@apollo-orbit/react';
import { ADD_AUTHOR_MUTATION, ADD_BOOK_MUTATION, AuthorFragmentDoc, AUTHORS_QUERY } from '../../graphql';

export const authorState = state(descriptor => descriptor
  .mutationUpdate(ADD_AUTHOR_MUTATION, (cache, info) => {
    const addAuthor = info.data?.addAuthor;
    if (!addAuthor) return;
    cache.updateQuery({ query: AUTHORS_QUERY }, data => data ? { authors: [...data.authors, addAuthor] } : data);
  })
  .mutationUpdate(ADD_BOOK_MUTATION, (cache, info) => {
    const addBook = info.data?.addBook;
    if (!addBook) return;
    const authorId = info.variables?.book.authorId as string;

    cache.updateFragment(
      {
        fragment: AuthorFragmentDoc,
        fragmentName: 'AuthorFragment',
        id: `Author:${authorId}`
      },
      author => author ? ({ ...author, books: [...author.books, addBook] }) : author
    );
  })
);
