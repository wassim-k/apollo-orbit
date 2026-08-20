import { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: 'tests/graphql/schema.graphql',
  documents: [
    'tests/graphql/book.graphql',
    'tests/graphql/author.graphql'
  ],
  config: {
    importSchemaTypesFrom: './tests/graphql/types.ts',
    useTypeImports: true,
    dedupeOperationSuffix: true,
    operationResultSuffix: 'Data',
    inlineFragmentTypes: 'combine',
    avoidOptionals: {
      field: true
    }
  },
  generates: {
    'tests/graphql/types.ts': {
      plugins: [
        {
          add: {
            content: '/* eslint-disable */'
          }
        },
        'typescript'
      ]
    },
    'tests/graphql/operations.ts': {
      plugins: [
        {
          add: {
            content: '/* eslint-disable */'
          }
        },
        'typescript-operations',
        '@apollo-orbit/codegen/core'
      ]
    }
  }
};

export default config;
