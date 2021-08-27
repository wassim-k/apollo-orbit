const baseConfig = require('../../jest.project')(__dirname);

module.exports = {
  ...baseConfig,
  testEnvironment: 'jsdom'
};
