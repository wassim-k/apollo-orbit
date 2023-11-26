
import { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: 'http://localhost:4000/graphql',
  config: {
    importFromCore: true,
    operationResultSuffix: 'Data',
    querySuffix: 'Query',
    mutationSuffix: 'Mutation',
    subscriptionSuffix: 'Subscription',
    dedupeOperationSuffix: true,
    inlineFragmentTypes: 'combine',
    avoidOptionals: {
      field: true
    }
  },
  generates: {
    './projects/core/src/app/graphql/types.ts': {
      documents: './projects/core/src/app/**/*.graphql',
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
