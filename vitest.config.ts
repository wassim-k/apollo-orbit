import tsConfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [
    tsConfigPaths({ root: __dirname, projects: ['tsconfig.spec.json'] })
  ],
  test: {
    globals: true,
    passWithNoTests: true,
    projects: ['./packages/*/vitest.config.ts'],
    expect: {
      requireAssertions: true
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: [
        'packages/*/src/**/*.ts',
        'packages/*/src/**/*.tsx'
      ],
      thresholds: {
        lines: 100,
        statements: 100
      }
    }
  }
});
