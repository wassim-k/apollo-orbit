import { modifyFragment, modifyQuery } from '@apollo-orbit/core';
import { gql, InMemoryCache } from '@apollo/client/core';

export const BookFragmentDoc = gql`
    fragment BookFragment on Book {
      __typename
      id
      name
      genre
      authorId
    }`;

export const AuthorFragmentDoc = gql`
    fragment AuthorFragment on Author {
      __typename
      id
      name
    }`;

export const AuthorWithBooksFragmentDoc = gql`
    fragment AuthorWithBooksFragment on Author {
      __typename
      id
      name
      books {
        ...BookFragment
      }
    }
    ${BookFragmentDoc}`;

describe('Cache', () => {
  describe('fragments', () => {
    it('should return null for unset fragment', () => {
      const cache = new InMemoryCache();
      const object = { __typename: 'Author', id: 1, name: 'old' };
      const id = cache.identify(object) as string;
      const value = cache.readFragment({ id, fragment: AuthorFragmentDoc });
      expect(value).toEqual(null);
    });

    it('should return an empty object for a fragment with null value', () => {
      const cache = new InMemoryCache();
      const object = { __typename: 'Author', id: 1, name: 'old' };
      const id = cache.identify(object) as string;
      cache.writeFragment({ id, fragment: AuthorFragmentDoc, data: null });
      const value = cache.readFragment({ id, fragment: AuthorFragmentDoc });
      expect(value).toEqual({});
    });

    it('should modify fragment', () => {
      const cache = new InMemoryCache();

      const object = {
        __typename: 'Author',
        id: 1,
        name: 'old'
      };

      const id = cache.identify(object) as string;
      cache.writeFragment({ id, fragment: AuthorFragmentDoc, data: object });

      modifyFragment(cache, { id, fragment: AuthorFragmentDoc }, (current: any) => ({
        ...current,
        name: 'new'
      }));

      const value = cache.readFragment({ id, fragment: AuthorFragmentDoc });
      expect(value).toEqual({
        __typename: 'Author',
        id: 1,
        name: 'new'
      });
    });

    it('should modify fragment with nested fragments', () => {
      const cache = new InMemoryCache();

      const books = [
        { __typename: 'Book', id: 5, name: 'Book 1', genre: 'Genre 1', authorId: 1 }
      ];

      const data = {
        __typename: 'Author',
        id: 1,
        name: 'old',
        books
      };

      const id = cache.identify(data) as string;
      const fragmentName = 'AuthorWithBooksFragment';
      cache.writeFragment({ id, fragment: AuthorWithBooksFragmentDoc, fragmentName, data });

      modifyFragment(cache, { id, fragment: AuthorWithBooksFragmentDoc, fragmentName }, (current: any) => ({
        ...current,
        name: 'new'
      }));

      const value = cache.readFragment({ id, fragment: AuthorWithBooksFragmentDoc, fragmentName });
      expect(value).toEqual({
        __typename: 'Author',
        id: 1,
        name: 'new',
        books
      });
    });

    it('should not call writeFragment if no value was returned', () => {
      const cache = new InMemoryCache();
      const object = { __typename: 'Author', id: 1, name: 'old' };
      const id = cache.identify(object) as string;
      cache.writeFragment({ id, fragment: AuthorFragmentDoc, data: object });
      const writeFragmentSpy = jest.spyOn(cache, 'writeFragment');
      modifyFragment(cache, { id, fragment: AuthorFragmentDoc }, (current: any) => void 0);
      expect(writeFragmentSpy).toBeCalledTimes(0);
    });
  });

  describe('queries', () => {
    it('should return null for non-existent query', () => {
      const cache = new InMemoryCache();
      const query = gql`{ value }`;
      expect(cache.readQuery({ query })).toBe(null);
    });

    it('should return null if a field exists on ROOT_QUERY then readQuery was called on another field', () => {
      const cache = new InMemoryCache();
      cache.writeQuery({ query: gql`{ other }`, data: { other: 'value' } });
      expect(cache.readQuery({ query: gql`{ value }` })).toBeNull();
    });

    it('should modify non-existent query', () => {
      const cache = new InMemoryCache();
      const query = gql`{ value }`;
      modifyQuery(cache, { query }, current => ({ value: 'new' }));
      expect(cache.readQuery({ query })).toEqual({ value: 'new' });
    });

    it('should modify query', () => {
      const cache = new InMemoryCache();
      const query = gql`{ value }`;

      cache.writeQuery({
        query,
        data: {
          value: 'old'
        }
      });

      modifyQuery(cache, { query }, current => ({ value: 'new' }));
      expect(cache.readQuery({ query })).toEqual({ value: 'new' });
    });

    it('should not call writeQuery if no value was returned', () => {
      const cache = new InMemoryCache();
      const query = gql`{ value }`;

      cache.writeQuery({
        query,
        data: {
          value: 'old'
        }
      });

      const writeQuerySpy = jest.spyOn(cache, 'writeQuery');
      modifyQuery(cache, { query }, current => void 0);

      expect(writeQuerySpy).toBeCalledTimes(0);
    });
  });
});
