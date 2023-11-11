import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  verbose: true,
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  collectCoverage: true,
  coverageReporters: ['json-summary', 'text', 'lcov', 'cobertura'],
  collectCoverageFrom: ['./src/**'],
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: 'test-results/jest',
      },
    ],
  ],
};

export default config;
