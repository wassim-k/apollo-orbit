import { gql } from '@apollo/client';
import { describe, expect, it } from 'vitest';
import { nameOfMutation, nameOfMutationDocument } from '../src/internal/mutationDocument';

describe('mutationDocument', () => {
  it('should get name from string mutation identifier', () => {
    expect(nameOfMutation('createUser')).toBe('createUser');
  });

  it('should get name from document mutation identifier', () => {
    const doc = gql`mutation UpdateUser { updateUser { id } }`;
    expect(nameOfMutation(doc)).toBe('UpdateUser');
  });

  it('should throw for invalid mutation identifier', () => {
    expect(() => nameOfMutation(123 as any)).toThrow('Invalid mutation identifier');
  });

  it('should throw for mutation document without name', () => {
    const doc = gql`mutation { createUser { id } }`;
    expect(() => nameOfMutationDocument(doc)).toThrow('ApolloOrbit requires mutations to have a name');
  });

  it('should throw for document without mutation definition', () => {
    const doc = gql`query GetUser { user { id } }`;
    expect(() => nameOfMutationDocument(doc)).toThrow('Must contain a mutation definition');
  });
});
