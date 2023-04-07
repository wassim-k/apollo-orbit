import { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig =
{
  overwrite: true,
  schema: 'schema.graphql',
  generates: {
    'src/types.ts': {
      plugins: [
        {
          add: {
            content: '/* eslint-disable */'
          }
        },
        'typescript'
      ]
    },
    'src/resolvers/types.ts': {
      config: {
        contextType: '../context#Context'
      },
      plugins: [
        {
          add: {
            content: '/* eslint-disable */'
          }
        },
        'typescript',
        'typescript-resolvers'
      ]
    }
  }
};

export default config;
