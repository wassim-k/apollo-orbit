import { gql } from '@apollo/client/core';
import { mergeOutputs, Types } from '@graphql-codegen/plugin-helpers';
import { validateTs } from '@graphql-codegen/testing';
import { plugin as tsPlugin } from '@graphql-codegen/typescript';
import { plugin as tsDocumentsPlugin } from '@graphql-codegen/typescript-operations';
import fs from 'fs';
import { buildSchema, GraphQLSchema } from 'graphql';
import path from 'path';
import { plugin } from '../src/index';

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

  it('should be allowed to define custom operation suffixes in config', async () => {
    const books = gql(`
            query Books {
              books {
                id
              }
            }
          `);

    const addBook = gql(`
            mutation AddBook($book: BookInput!) {
                addBook(book: $book) {
                  id
                }
              }
          `);

    const newBook = gql(`
          subscription NewBook {
            newBook {
              id
            }
          }
        `);

    const docs = [
      { location: '', document: books },
      { location: '', document: addBook },
      { location: '', document: newBook }
    ];
    const content = (await plugin(
      schema,
      docs,
      {
        querySuffix: 'Query',
        mutationSuffix: 'Mutation',
        subscriptionSuffix: 'Subscription'
      },
      {
        outputFile: 'graphql.ts'
      }
    )) as Types.ComplexPluginOutput;

    expect(content.content).toContain('export class BooksQuery');
    expect(content.content).toContain('export class AddBookMutation');
    expect(content.content).toContain('export class NewBookSubscription');
    await validateTypeScript(content, schema, docs, {});
  });
});
