import { defineConfig, mergeConfig } from 'vitest/config';
import baseConfig from '../../vitest.config';

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      name: 'react',
      environment: 'jsdom',
      include: ['tests/**/*.spec.ts(x)?']
    }
  })
);
