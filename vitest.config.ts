import { defineConfig, mergeConfig } from 'vitest/config';
import sharedConfig from './vitest.shared';

export default mergeConfig(
  sharedConfig,
  defineConfig({
    test: {
      projects: ['./packages/**/vitest.config.ts'],
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
  })
);
