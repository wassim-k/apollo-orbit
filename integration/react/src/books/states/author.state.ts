import { modifyQuery, state } from '@apollo-orbit/react';
import { AddAuthorDocument, AuthorsDocument } from '../api/author';

const Toastify = require('toastify-js'); // eslint-disable-line @typescript-eslint/no-var-requires

export const authorState = state(descriptor => descriptor
  .mutationUpdate(AddAuthorDocument, (cache, result) => {
    const addAuthor = result.data?.addAuthor;
    if (!addAuthor) return;
    modifyQuery(cache, { query: AuthorsDocument }, query => query ? { authors: [...query.authors, addAuthor] } : query);
  })
  .effect(AddAuthorDocument, result => {
    if (result.data?.addAuthor) {
      Toastify({
        text: `New author '${result.data.addAuthor.name}' was added.`,
        duration: 3000,
        backgroundColor: 'linear-gradient(to right, #00b09b, #96c93d)'
      }).showToast();
    } else if (result.error) {
      Toastify({
        text: `Failed to add new author: ${result.error.message}`,
        duration: 3000,
        backgroundColor: 'linear-gradient(to right, #ff5f6d, #ffc371)'
      }).showToast();
    }
  })
);
