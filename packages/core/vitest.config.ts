import { defineConfig, mergeConfig } from 'vitest/config';
import sharedConfig from '../../vitest.shared';

export default mergeConfig(
  sharedConfig,
  defineConfig({
    test: {
      name: 'core',
      environment: 'node',
      include: ['tests/**/*.spec.ts']
    }
  })
);
