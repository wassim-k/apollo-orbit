import { defineConfig, mergeConfig } from 'vitest/config';
import sharedConfig from '../../vitest.shared';

export default mergeConfig(
  sharedConfig,
  defineConfig({
    test: {
      name: 'react',
      environment: 'jsdom',
      include: ['tests/**/*.spec.ts(x)?']
    }
  })
);
