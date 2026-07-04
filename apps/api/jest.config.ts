import type { Config } from 'jest';

const config: Config = {
  displayName: 'api',
  testEnvironment: 'node',
  preset: 'ts-jest',
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
  testMatch: ['**/*.spec.ts', '**/*.test.ts'],
  moduleNameMapper: {
    '@serveiq/shared/models': '<rootDir>/../../libs/shared/models/src/index.ts',
    '@serveiq/shared/data-access': '<rootDir>/../../libs/shared/data-access/src/index.ts',
  },
};

export default config;
