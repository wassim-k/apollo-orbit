import shortid from 'shortid';
import { AuthorContext } from '../context.js';
import { Author, AuthorInput } from '../types.js';
import { AuthorData, data } from './data.js';
import { applyFilters } from './utils/filter.js';

export const authorsContext: AuthorContext = {
  addAuthor: (input: AuthorInput): Author => {
    const newAuthor: AuthorData = { id: shortid.generate(), age: input.age, name: input.name };
    data.authors.push(newAuthor);
    return newAuthor as Author;
  },
  getById: (id: string): Author => {
    return data.authors.find(author => author.id === id) as Author;
  },
  getAll: (filter?: Partial<Pick<Author, 'name' | 'age'>>) => {
    return (
      filter
        ? data.authors.filter(applyFilters(filter))
        : data.authors
    ) as Array<Author>;
  }
};
