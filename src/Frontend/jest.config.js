const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'jsdom',
  testMatch: ['**/tests/unit/**/*.test.{ts,tsx,js,jsx}'],
  moduleNameMapper: {
    // Mock next/font
    '^next/font/(.*)$': '<rootDir>/__mocks__/nextFontMock.js',
    '^next/image$': '<rootDir>/__mocks__/nextImageMock.js',
    '\\.(css|less|scss|sass)$': '<rootDir>/__mocks__/styleMock.js',
    '\\.(jpg|jpeg|png|gif|svg|webp|ico)$': '<rootDir>/__mocks__/fileMock.js',
  },
  coverageReporters: ['json-summary', 'text'],
};

module.exports = createJestConfig(config);
