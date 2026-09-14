import { fileURLToPath } from 'node:url';
import { defineConfig, mergeConfig } from 'vitest/config';
import sharedConfig from '../../vitest.shared';

export default mergeConfig(
  sharedConfig,
  defineConfig({
    test: {
      name: 'codegen',
      environment: 'node',
      include: ['tests/**/*.spec.ts']
    },
    resolve: {
      alias: {
        // Force graphql imports to use a single instance to prevent
        // "Cannot use GraphQLScalarType from another module" errors
        graphql: fileURLToPath(
          new URL('../../node_modules/graphql/index.js', import.meta.url)
        )
      }
    },
    ssr: {
      // Inline @graphql-codegen/testing for ESM/CJS compatibility
      noExternal: ['@graphql-codegen/testing']
    }
  })
);
