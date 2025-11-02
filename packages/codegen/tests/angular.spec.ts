import * as apolloOrbitAngularPlugin from '@apollo-orbit/codegen/angular';
import { codegen } from '@graphql-codegen/core';
import * as typescriptPlugin from '@graphql-codegen/typescript';
import * as typescriptOperationsPlugin from '@graphql-codegen/typescript-operations';
import { DocumentMode } from '@graphql-codegen/visitor-plugin-common';
import fs from 'fs';
import { parse } from 'graphql';
import path from 'path';

describe('Angular Codegen', () => {
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
        apolloOrbit: apolloOrbitAngularPlugin
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

  it('should validate config and file extension', async () => {
    // Test invalid file extension
    await expect(
      codegen({
        schema: parse(schemaDocument),
        documents: [{ location: operationsPath, document: parse(operationsDocument) }],
        filename: 'graphql.js',
        pluginMap: { apolloOrbit: apolloOrbitAngularPlugin },
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
        pluginMap: { apolloOrbit: apolloOrbitAngularPlugin },
        plugins: [{ apolloOrbit: { documentMode: DocumentMode.string } }],
        config: {}
      })
    ).rejects.toThrow('does not support \'documentMode: string\'');
  });
});
