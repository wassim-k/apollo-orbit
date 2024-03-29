const { resolve } = require('path');
const { pathsToModuleNameMapper } = require('ts-jest');
const tsconfig = resolve(__dirname, 'tsconfig.spec.json');
const { compilerOptions } = require(tsconfig);

module.exports = projectDir => {
  const pkg = require(resolve(projectDir, 'package.json'));
  return {
    displayName: pkg.name,
    rootDir: projectDir,
    testEnvironment: 'node',
    transform: { '^.+\\.tsx?$': ['ts-jest', { tsconfig }] },
    modulePathIgnorePatterns: ['dist'],
    testPathIgnorePatterns: ['/node_modules/', '/dist/'],
    moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, { prefix: `${__dirname}/` })
  };
};
