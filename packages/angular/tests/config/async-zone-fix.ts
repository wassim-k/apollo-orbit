import { transformSync } from 'esbuild';
import { defineConfig } from 'vitest/config';

const apolloFiles = ['QueryManager.js', 'ObservableQuery.js', 'LocalState.js'];

// Plugin to transform specific Apollo Client files that have async/promise wrapping issues
export default defineConfig({
  ssr: { noExternal: ['@apollo/client'] },
  plugins: [{
    name: 'apollo-zone-fix',
    enforce: 'pre',
    transform: (code, id) => {
      if (!id.includes('@apollo/client')) return undefined;

      // Disable __DEV__ in the environment module to prevent devtools setTimeout
      if (id.includes('utilities/environment/index')) {
        return { code: code.replace('true', 'false') };
      }

      // Transform async/promise wrapping files
      if (apolloFiles.some(f => id.endsWith(f))) {
        return transformSync(code, { loader: 'js', target: 'es2016', format: 'esm' });
      }

      return undefined;
    }
  }]
});
