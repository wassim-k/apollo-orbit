import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

const { compilerOptions } = JSON.parse(readFileSync(resolve(__dirname, 'tsconfig.spec.json'), 'utf8')) as {
  compilerOptions: { paths: Record<string, Array<string>> };
};

const alias = Object.entries(compilerOptions.paths)
  .map(([find, [target]]) => ({ find, replacement: resolve(__dirname, target) }))
  .sort((a, b) => b.find.length - a.find.length);

export default defineConfig({
  resolve: { alias },
  test: {
    globals: true,
    passWithNoTests: true,
    expect: {
      requireAssertions: true
    }
  }
});
