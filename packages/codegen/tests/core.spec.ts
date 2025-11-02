import * as apolloOrbitCorePlugin from '@apollo-orbit/codegen/core';
import { codegen } from '@graphql-codegen/core';
import * as typescriptPlugin from '@graphql-codegen/typescript';
import * as typescriptOperationsPlugin from '@graphql-codegen/typescript-operations';
import { DocumentMode } from '@graphql-codegen/visitor-plugin-common';
import fs from 'fs';
import { parse } from 'graphql';
import path from 'path';

describe('Core Codegen', () => {
  const schemaPath = path.join(__dirname, './graphql/schema.graphql');
  const operationsPath = path.join(__dirname, './graphql/operations.graphql');

  const schemaDocument = fs.readFileSync(schemaPath, 'utf8');
  const operationsDocument = fs.readFileSync(operationsPath, 'utf8');

  const runCodegen = async (config: any = {}) => {
    return codegen({
      schema: parse(schemaDocument),
      documents: [{ location: operationsPath, document: parse(operationsDocument) }],
      filename: 'graphql.ts',
      pluginMap: {
        typescript: typescriptPlugin,
        typescriptOperations: typescriptOperationsPlugin,
        apolloOrbit: apolloOrbitCorePlugin
      },
      plugins: [
        { typescript: {} },
        { typescriptOperations: {} },
        { apolloOrbit: config }
      ],
      config: {}
    });
  };

  it('should generate code for all operation types with default config', async () => {
    const output = await runCodegen({});

    expect(output).toBeDefined();
    expect(output).toContain('export const BOOK_QUERY');
    expect(output).toContain('export const ADD_BOOK_MUTATION');
    expect(output).toContain('export const NEW_BOOK_SUBSCRIPTION');
    expect(output).toMatchSnapshot();
  });

  it('should generate code with gqlFunction enabled', async () => {
    const output = await runCodegen({ gqlFunction: true });

    // Should generate gql function for operations
    expect(output).toContain('export function gqlBookQuery');
    expect(output).toContain('export function gqlAddBookMutation');
    expect(output).toContain('export function gqlNewBookSubscription');
    expect(output).toContain('export function gqlDeleteAllBooksMutation()');
  });

  it('should generate code with gqlVariablesAsFunction enabled', async () => {
    const output = await runCodegen({ gqlFunction: true, gqlVariablesAsFunction: true });

    // Should have overload with no parameters for optional variables
    expect(output).toContain('export function gqlBooksQuery():');
    expect(output).toContain('export function gqlBooksQuery(variables');
  });

  it('should generate code with external documentMode', async () => {
    const output = await runCodegen({
      documentMode: DocumentMode.external,
      importDocumentNodeExternallyFrom: './operations',
      gqlFunction: true
    });

    expect(output).toContain('Operations.Book');
    expect(output).toContain('Operations.AddBook');
  });

  it('should generate code with custom documentFieldName', async () => {
    const output = await runCodegen({
      gqlFunction: true,
      documentFieldName: {
        query: 'gqlQuery',
        mutation: 'gqlMutation',
        subscription: 'gqlSubscription'
      }
    });

    expect(output).toContain('gqlQuery:');
    expect(output).toContain('gqlMutation:');
    expect(output).toContain('gqlSubscription:');
  });

  it('should generate code with custom documentVariableSuffix', async () => {
    const output = await runCodegen({
      documentVariableSuffix: 'Document'
    });

    // Should use the custom suffix instead of operation type
    expect(output).toContain('export const BOOK_DOCUMENT');
    expect(output).toContain('export const ADD_BOOK_DOCUMENT');
    expect(output).toContain('export const NEW_BOOK_DOCUMENT');
  });

  it('should generate code with graphQLTag documentMode', async () => {
    const result = await runCodegen({
      documentMode: DocumentMode.graphQLTag
    });

    // DocumentMode.graphQLTag imports TypedDocumentNode as DocumentNode
    expect(result).toContain('TypedDocumentNode as DocumentNode');
    expect(result).toContain('as DocumentNode<');
  });

  it('should validate config and file extension', async () => {
    // Test invalid file extension
    await expect(
      codegen({
        schema: parse(schemaDocument),
        documents: [{ location: operationsPath, document: parse(operationsDocument) }],
        filename: 'graphql.js',
        pluginMap: { apolloOrbit: apolloOrbitCorePlugin },
        plugins: [{ apolloOrbit: {} }],
        config: {}
      })
    ).rejects.toThrow('requires extension to be ".ts"');

    // Test unsupported documentMode: string
    await expect(
      codegen({
        schema: parse(schemaDocument),
        documents: [{ location: operationsPath, document: parse(operationsDocument) }],
        filename: 'graphql.ts',
        pluginMap: { apolloOrbit: apolloOrbitCorePlugin },
        plugins: [{ apolloOrbit: { documentMode: DocumentMode.string } }],
        config: {}
      })
    ).rejects.toThrow('does not support \'documentMode: string\'');
  });

  it('should throw error for unnamed operation in external documentMode', async () => {
    const unnamedOperation = `
      query {
        books {
          id
          name
        }
      }
    `;

    await expect(
      codegen({
        schema: parse(schemaDocument),
        documents: [{ location: operationsPath, document: parse(unnamedOperation) }],
        filename: 'graphql.ts',
        pluginMap: { apolloOrbit: apolloOrbitCorePlugin },
        plugins: [{
          apolloOrbit: {
            documentMode: DocumentMode.external,
            importDocumentNodeExternallyFrom: './operations',
            gqlFunction: true
          }
        }],
        config: {}
      })
    ).rejects.toThrow('Operation node must have a name');
  });
});
