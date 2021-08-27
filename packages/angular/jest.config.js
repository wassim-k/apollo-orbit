const { snapshotSerializers, globals } = require('jest-preset-angular/jest-preset.js');
const baseConfig = require('../../jest.project')(__dirname);

module.exports = {
  ...baseConfig,
  globals: {
    'ts-jest': {
      ...globals['ts-jest'],
      ...baseConfig.globals['ts-jest']
    }
  },
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: [
    `${__dirname}/tests/config/setupJest.ts`
  ],
  snapshotSerializers
};
