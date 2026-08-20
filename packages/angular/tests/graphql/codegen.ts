import { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: [
    'tests/graphql/schema.graphql',
    {
      'tests/state.spec.ts': {
        noRequire: true
      }
    }
  ],
  documents: [
    'tests/graphql/book.graphql',
    'tests/graphql/author.graphql',
    'tests/graphql/client.graphql'
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
        '@apollo-orbit/codegen'
      ]
    }
  }
};

export default config;
