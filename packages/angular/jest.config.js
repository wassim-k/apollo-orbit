const { createCjsPreset } = require('jest-preset-angular/presets');
const baseConfig = require('../../jest.project')(__dirname);
const { moduleNameMapper } = baseConfig;
const preset = createCjsPreset({ tsconfig: 'tsconfig.spec.json', });

module.exports = {
  ...baseConfig,
  ...preset,
  moduleNameMapper,
  setupFilesAfterEnv: [
    `${__dirname}/tests/config/setup-jest.ts`
  ],
  // Patch for double async + promise wrapped methods in @apollo/client
  transform: {
    ...preset.transform,
    '(QueryManager|LocalState|ObservableQuery).cjs$': [
      'ts-jest',
      {
        tsconfig: {
          target: 'es2016',
          allowJs: true
        }
      }
    ]
  },
  transformIgnorePatterns: [
    'node_modules/(?!(.*\\.mjs|.*\\.cjs)$)'
  ]
};
