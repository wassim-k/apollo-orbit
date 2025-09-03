import { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: [
    'http://localhost:4000/graphql',
    {
      './src/**/*.state.ts': {
        noRequire: true
      }
    }
  ],
  documents: './src/**/*.graphql',
  config: {
    documentMode: 'graphQLTag',
    documentNodeImport: '@apollo/client#TypedDocumentNode',
    dedupeOperationSuffix: true,
    inlineFragmentTypes: 'combine',
    avoidOptionals: {
      field: true
    }
  },
  generates: {
    './src/graphql/types.ts': {
      plugins: [
        {
          add: {
            content: '/* eslint-disable */'
          }
        },
        'typescript',
        'typescript-operations',
        '@apollo-orbit/codegen/core'
      ]
    }
  }
};

export default config;
