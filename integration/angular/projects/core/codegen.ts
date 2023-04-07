
import { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: [
    'http://localhost:4000/graphql',
    {
      './projects/core/src/app/**/*.state.ts': {
        noRequire: true
      }
    }
  ],
  config: {
    importFromCore: true,
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
