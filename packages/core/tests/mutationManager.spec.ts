import { MutationManager, state } from '@apollo-orbit/core';
import { ApolloClient, CombinedGraphQLErrors, NormalizedExecutionResult, TypedDocumentNode, gql } from '@apollo/client';

interface AddBookData { addBook: { __typename: 'Book'; id: string } | null }
const ADD_BOOK: TypedDocumentNode<AddBookData, Record<string, never>> = gql`mutation AddBook { addBook { id } }`;

describe('MutationManager', () => {
  describe('runEffects', () => {
    let manager: MutationManager;
    let seen: Array<unknown>;

    beforeEach(() => {
      seen = [];
      manager = new MutationManager();
      manager.addState(state(descriptor => descriptor.effect(ADD_BOOK, info => seen.push(info.error))));
    });

    it('should report an error the mutation threw', () => {
      const error = new Error('boom');

      manager.runEffects({ mutation: ADD_BOOK }, undefined, error);

      expect(seen).toEqual([error]);
    });

    // Under `all` a failed mutation resolves and carries its error on the result instead.
    it('should report an error carried on a resolved result', () => {
      const error = new CombinedGraphQLErrors({ errors: [{ message: 'boom' }] });

      manager.runEffects({ mutation: ADD_BOOK }, { data: undefined, error }, undefined);

      expect(seen).toEqual([error]);
    });

    it('should report no error when the mutation succeeded', () => {
      manager.runEffects({ mutation: ADD_BOOK }, { data: { addBook: { __typename: 'Book', id: '1' } } }, undefined);

      expect(seen).toEqual([undefined]);
    });
  });

  describe('withMutationOptions', () => {
    const BOOKS = gql`query Books { books { id } }`;
    const AUTHORS = gql`query Authors { authors { id } }`;
    const result: NormalizedExecutionResult<AddBookData> = { data: { addBook: null }, dataState: 'complete' };

    let manager: MutationManager;

    beforeEach(() => {
      manager = new MutationManager();
      manager.addState(state(descriptor => descriptor.refetchQueries(ADD_BOOK, () => [{ query: BOOKS }])));
    });

    const include = (refetchQueries: ApolloClient.MutateOptions<AddBookData>['refetchQueries']): unknown => {
      const { refetchQueries: merged } = manager.withMutationOptions({ mutation: ADD_BOOK, refetchQueries });

      return typeof merged === 'function' ? merged(result) : merged;
    };

    it('should merge a state list with a list passed in options', () => {
      expect(include([{ query: AUTHORS }])).toEqual([{ query: AUTHORS }, { query: BOOKS }]);
    });

    it('should merge a state list when options pass none', () => {
      expect(include(undefined)).toEqual([{ query: BOOKS }]);
    });

    it.each([
      ['active', 'all', 'all'],
      ['all', 'active', 'all'],
      ['all', 'all', 'all'],
      ['active', 'active', 'active']
    ] as const)(
      'merges caller %s and state %s into %s', (caller, configured, expected) => {
        manager = new MutationManager();
        manager.addState(state(descriptor => descriptor.refetchQueries(ADD_BOOK, () => configured)));
        expect(include(caller)).toBe(expected);
        expect(include([])).toBe(configured);
      }
    );

    // A shorthand is a single value, so spreading it would yield its characters.
    it('should reject a list combined with a shorthand passed in options', () => {
      expect(() => include('active')).toThrow('Cannot combine refetchQueries');
    });

    it('should reject a state list combined with a shorthand returned by the caller', () => {
      expect(() => include(() => 'all')).toThrow('Cannot combine refetchQueries');
    });

    it('should keep a shorthand when a state contributes nothing', () => {
      const empty = new MutationManager();
      empty.addState(state(descriptor => descriptor.refetchQueries(ADD_BOOK, () => [])));

      const { refetchQueries } = empty.withMutationOptions({ mutation: ADD_BOOK, refetchQueries: 'active' });

      expect(typeof refetchQueries === 'function' ? refetchQueries(result) : refetchQueries).toBe('active');
    });

    it('should reject a caller list combined with a shorthand returned by a state', () => {
      const shorthand = new MutationManager();
      shorthand.addState(state(descriptor => descriptor.refetchQueries(ADD_BOOK, () => 'active')));

      const { refetchQueries } = shorthand.withMutationOptions({ mutation: ADD_BOOK, refetchQueries: [{ query: BOOKS }] });

      expect(() => typeof refetchQueries === 'function' ? refetchQueries(result) : refetchQueries).toThrow('Cannot combine refetchQueries');
    });
  });
});
