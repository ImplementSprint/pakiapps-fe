const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Path to the Next.js app so next/jest can find next.config.ts and .env files
  dir: './',
});

const customJestConfig = {
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testMatch: ['<rootDir>/tests/unit/**/*.{test,spec}.{ts,tsx,js,jsx}'],
  testPathIgnorePatterns: ['/node_modules/', '/.next/'],
  modulePathIgnorePatterns: ['<rootDir>/.next/'],
  moduleNameMapper: {
    // Support @/* alias pointing at src/*
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverage: true,
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['json-summary', 'text', 'lcov'],
  collectCoverageFrom: [
    '<rootDir>/src/**/*.{ts,tsx}',
    '!<rootDir>/src/**/*.d.ts',
    '!<rootDir>/src/**/*.stories.{ts,tsx}',
  ],
  // Coverage thresholds intentionally set low — increase as test suite grows
  coverageThreshold: {
    global: {
      branches: 0,
      functions: 0,
      lines: 0,
      statements: 0,
    },
  },
};

module.exports = createJestConfig(customJestConfig);
