import { identifyFragment } from '@apollo-orbit/angular';
import { state } from '@apollo-orbit/angular/state';
import { gql, TypedDocumentNode } from '@apollo/client';
import { ADD_BOOK_MUTATION, AuthorFragment, AuthorFragmentDoc, BookFragmentDoc } from '../../graphql';

const authorFragment = gql`${AuthorFragmentDoc}${BookFragmentDoc}` as TypedDocumentNode<AuthorFragment>;

export const authorState = () => state(descriptor => descriptor
  .mutationUpdate(ADD_BOOK_MUTATION, (cache, info) => {
    const addBook = info.data?.addBook;
    if (!addBook) return;
    const authorId = info.variables?.book.authorId as string;

    cache.updateFragment(
      identifyFragment(authorFragment, authorId),
      author => author ? ({ ...author, books: [...author.books, addBook] }) : author
    );
  })
);
