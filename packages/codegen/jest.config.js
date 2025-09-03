import { dirname } from 'path';
import { fileURLToPath } from 'url';
import configureProject from '../../jest.project.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default {
  ...configureProject(__dirname),
  resolver: '../../node_modules/bob-the-bundler/jest-resolver.cjs',
};
