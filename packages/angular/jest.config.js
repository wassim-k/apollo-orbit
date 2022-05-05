const ngPreset = require('jest-preset-angular/presets/defaults-esm/jest-preset');
const baseConfig = require('../../jest.project')(__dirname);

const { tslib, ...moduleNameMapper } = ngPreset.moduleNameMapper;

module.exports = {
  ...baseConfig,
  ...ngPreset,
  globals: {
    'ts-jest': {
      ...ngPreset.globals['ts-jest'],
      ...baseConfig.globals['ts-jest']
    }
  },
  moduleNameMapper: {
    ...moduleNameMapper,
    ...baseConfig.moduleNameMapper
  },
  transform: { '^.+\\.(ts|mjs|js|html)$': 'jest-preset-angular' },
  transformIgnorePatterns: ['node_modules/(?!.*.mjs$)'],
  setupFilesAfterEnv: [
    `${__dirname}/tests/config/setup-jest.ts`
  ]
};
