
import { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: [
    'http://localhost:4000/graphql',
    {
      './projects/effects/src/**/*.state.ts': {
        noRequire: true
      }
    }
  ],
  documents: './projects/effects/src/**/*.graphql',
  config: {
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
    './projects/effects/src/app/graphql/types.ts': {
      documents: './projects/effects/src/app/**/*.graphql',
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
