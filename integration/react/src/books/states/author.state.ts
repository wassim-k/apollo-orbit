import { modifyQuery, state } from '@apollo-orbit/react';
import { AddAuthorDocument, AuthorsDocument } from '../gql/author';

export const authorState = state(descriptor => descriptor
  .mutationUpdate(AddAuthorDocument, (cache, result) => {
    const addAuthor = result.data?.addAuthor;
    if (!addAuthor) return;
    modifyQuery(cache, { query: AuthorsDocument }, query => query ? { authors: [...query.authors, addAuthor] } : query);
  })
);
