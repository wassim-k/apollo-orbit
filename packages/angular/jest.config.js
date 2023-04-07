const ngPreset = require('jest-preset-angular/presets/defaults/jest-preset');
const baseConfig = require('../../jest.project')(__dirname);
const { moduleNameMapper } = baseConfig;

module.exports = {
  ...baseConfig,
  ...ngPreset,
  moduleNameMapper,
  setupFilesAfterEnv: [
    `${__dirname}/tests/config/setup-jest.ts`
  ]
};
