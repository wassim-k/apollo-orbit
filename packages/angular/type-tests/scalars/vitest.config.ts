import angular from '@analogjs/vite-plugin-angular';
import { resolve } from 'node:path';
import { mergeConfig } from 'vitest/config';
import sharedConfig from '../../../../vitest.shared';
import { defineTypeTestProject } from '../project';

// Scalar declarations require a separate TS program; these tests also verify runtime conversion.
export default mergeConfig(mergeConfig(sharedConfig, defineTypeTestProject('scalars')), {
  plugins: [angular({ tsconfig: resolve(__dirname, 'tsconfig.json') })],
  test: {
    environment: 'jsdom',
    include: ['*.spec.ts'],
    setupFiles: ['../../tests/config/setup-vitest.ts'],
    typecheck: { only: false }
  }
});
