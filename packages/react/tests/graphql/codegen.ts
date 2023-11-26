
import { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: 'tests/graphql/schema.graphql',
  documents: [
    'tests/graphql/book.graphql',
    'tests/graphql/author.graphql'
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
        'typed-document-node'
      ]
    }
  }
};

export default config;
