
import { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: 'tests/graphql/schema.graphql',
  documents: [
    'tests/graphql/books.graphql',
    'tests/graphql/authors.graphql'
  ],
  config: {
    dedupeOperationSuffix: true,
    operationResultSuffix: 'Data',
    querySuffix: 'Query',
    mutationSuffix: 'Mutation',
    subscriptionSuffix: 'Subscription',
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
