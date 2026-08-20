import { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: 'http://localhost:4000/graphql',
  config: {
    importSchemaTypesFrom: './projects/core/src/app/graphql/types.ts',
    useTypeImports: true,
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
