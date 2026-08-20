import { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: 'http://localhost:4000/graphql',
  config: {
    operationResultSuffix: 'Data',
    dedupeOperationSuffix: true,
    inlineFragmentTypes: 'combine',
    avoidOptionals: {
      field: true
    }
  },
  generates: {
    './projects/core/src/app/graphql/types.ts': {
      plugins: [
        {
          add: {
            content: '/* eslint-disable */'
          }
        },
        'typescript'
      ]
    },
    './projects/core/src/app/graphql/operations.ts': {
      documents: './projects/core/src/app/**/*.graphql',
      config: {
        importSchemaTypesFrom: './projects/core/src/app/graphql/types.ts'
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
