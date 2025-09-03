import { plugin as angularPlugin } from '@apollo-orbit/codegen/angular';
import { plugin as corePlugin } from '@apollo-orbit/codegen/core';
import { gql } from '@apollo/client';
import { mergeOutputs, Types } from '@graphql-codegen/plugin-helpers';
import { validateTs } from '@graphql-codegen/testing';
import { plugin as tsPlugin } from '@graphql-codegen/typescript';
import { plugin as tsDocumentsPlugin } from '@graphql-codegen/typescript-operations';
import fs from 'fs';
import { buildSchema, GraphQLSchema } from 'graphql';
import path from 'path';

describe('Codegen', () => {
  const schemaPath = path.join(__dirname, './graphql/schema.graphql');
  const schemaDocument: string = fs.readFileSync(schemaPath, 'utf8');
  const schema = buildSchema(schemaDocument);

  const validateTypeScript = async (
    output: Types.PluginOutput,
    testSchema: GraphQLSchema,
    documents: Array<Types.DocumentFile>,
    config: any
  ): Promise<void> => {
    const tsOutput = await tsPlugin(testSchema, documents, config, { outputFile: '' });
    const tsDocumentsOutput = await tsDocumentsPlugin(testSchema, documents, config, { outputFile: '' });
    const merged = mergeOutputs([tsOutput, tsDocumentsOutput, output]);
    validateTs(merged, undefined, true);
  };

  describe('Core', () => {
    it('should codegen', async () => {
      const books = gql`
        query Books {
          books {
            id
          }
        }`;

      const book = gql`
        query Book($id: ID!) {
          book(id: $id) {
            id
          }
        }`;

      const addBook = gql`
        mutation AddBook($book: BookInput!) {
          addBook(book: $book) {
            id
          }
        }`;

      const newBook = gql`
        subscription NewBook {
          newBook {
            id
          }
        }`;

      const docs = [
        { location: '', document: books },
        { location: '', document: book },
        { location: '', document: addBook },
        { location: '', document: newBook }
      ];
      const content = (await corePlugin(
        schema,
        docs,
        {},
        {
          outputFile: 'graphql.ts'
        }
      )) as Types.ComplexPluginOutput;

      await validateTypeScript(content, schema, docs, {});
      expect(content).toMatchSnapshot();
    });
  });

  describe('Angular', () => {
    it('should codegen', async () => {
      const books = gql`
      query Books {
        books {
          id
        }
      }`;

      const book = gql`
      query Book($id: ID!) {
        book(id: $id) {
          id
        }
      }`;

      const addBook = gql`
      mutation AddBook($book: BookInput!) {
        addBook(book: $book) {
          id
        }
      }`;

      const newBook = gql`
      subscription NewBook {
        newBook {
          id
        }
      }`;

      const docs = [
        { location: '', document: books },
        { location: '', document: book },
        { location: '', document: addBook },
        { location: '', document: newBook }
      ];
      const content = (await angularPlugin(
        schema,
        docs,
        {},
        {
          outputFile: 'graphql.ts'
        }
      )) as Types.ComplexPluginOutput;

      await validateTypeScript(content, schema, docs, {});
      expect(content).toMatchSnapshot();
    });
  });
});
