import fs from 'fs';
import path from 'path';
import { Application, DeclarationReflection } from 'typedoc';

export async function generateApiDocs(): Promise<DeclarationReflection> {
  const app = await Application.bootstrapWithPlugins({
    entryPoints: [
      toPosixPath(path.resolve(__dirname, '../../node_modules/@apollo/client/core/watchQueryOptions.d.ts')),
      toPosixPath(path.resolve(__dirname, '../../packages/angular/src/types.ts')),
      toPosixPath(path.resolve(__dirname, '../../packages/angular/src/signals/query.ts')),
      toPosixPath(path.resolve(__dirname, '../../packages/angular/src/signals/mutation.ts')),
      toPosixPath(path.resolve(__dirname, '../../packages/angular/src/signals/subscription.ts')),
      toPosixPath(path.resolve(__dirname, '../../packages/angular/src/signals/fragment.ts')),
      toPosixPath(path.resolve(__dirname, '../../packages/angular/src/signals/cacheQuery.ts'))
    ],
    tsconfig: toPosixPath(path.resolve(__dirname, '../../packages/angular/tsconfig.json')),
    blockTags: ['@docGroup', '@default'],
    readme: 'none',
    sort: ['source-order']
  });

  const project = await app.convert();

  const outputPath = path.resolve(__dirname, '../build/api-data.json');

  await app.generateJson(project, outputPath);

  return JSON.parse(fs.readFileSync(outputPath, 'utf-8'));
}

function toPosixPath(p: string): string {
  return p.replaceAll('\\', '/');
}

if (require.main === module) {
  generateApiDocs();
}
