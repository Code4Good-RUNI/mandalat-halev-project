/// <reference types="jest" />
/// <reference types="node" />
const baseConfig = require('./jest.config.cts');

module.exports = {
  ...baseConfig,
  displayName: 'mobile-integration',
  testMatch: ['**/*.integration.spec.ts'],
  setupFiles: ['<rootDir>/src/test-support/integration-env-setup.ts'],
};
