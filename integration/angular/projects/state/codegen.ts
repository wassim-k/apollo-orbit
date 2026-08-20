import { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: [
    'http://localhost:4000/graphql',
    {
      './projects/state/src/**/*.state.ts': {
        noRequire: true
      }
    }
  ],
  documents: './projects/state/src/**/*.graphql',
  config: {
    operationResultSuffix: 'Data',
    dedupeOperationSuffix: true,
    inlineFragmentTypes: 'combine',
    avoidOptionals: {
      field: true
    }
  },
  generates: {
    './projects/state/src/app/graphql/types.ts': {
      plugins: [
        {
          add: {
            content: '/* eslint-disable */'
          }
        },
        'typescript'
      ]
    },
    './projects/state/src/app/graphql/operations.ts': {
      documents: './projects/state/src/app/**/*.graphql',
      config: {
        importSchemaTypesFrom: './projects/state/src/app/graphql/types.ts'
      },
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
