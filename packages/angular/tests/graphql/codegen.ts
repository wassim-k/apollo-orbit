import { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: 'tests/graphql/schema.graphql',
  documents: [
    'tests/graphql/book.graphql',
    'tests/graphql/author.graphql',
    'tests/graphql/client.graphql'
  ],
  config: {
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
        'typescript',
        'typescript-operations',
        '@apollo-orbit/codegen'
      ]
    }
  }
};

export default config;
