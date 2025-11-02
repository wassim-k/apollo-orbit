import angular from '@analogjs/vite-plugin-angular';
import { defineConfig, mergeConfig } from 'vitest/config';
import baseConfig from '../../vitest.config';
import asyncZoneFix from './tests/config/async-zone-fix.js';

export default mergeConfig(
  baseConfig,
  mergeConfig(
    asyncZoneFix,
    defineConfig({
      plugins: [
        angular({
          tsconfig: 'tests/tsconfig.json'
        })
      ],
      test: {
        name: 'angular',
        environment: 'jsdom',
        include: ['tests/**/*.spec.ts'],
        setupFiles: ['tests/config/setup-vitest.ts']
      }
    })
  )
);
