// plugins/generateApiTablesPlugin.ts
import type { LoadContext, Plugin } from '@docusaurus/types';
import generateApiTables from '../scripts/generateApiTables';

export default function generateApiTablesPlugin(
  context: LoadContext,
  options: any
): Plugin {
  return {
    name: 'generate-api-tables',

    async loadContent() {
      await generateApiTables();
    },

    getPathsToWatch() {
      const { siteDir } = context;
      return [`${siteDir}/build/api-data.json`];
    }
  };
}
