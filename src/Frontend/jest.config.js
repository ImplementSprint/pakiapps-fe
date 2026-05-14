/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'jsdom',
  testMatch: ['**/tests/unit/**/*.test.{ts,tsx,js,jsx}'],
  transform: {
    '^.+\\.[jt]sx?$': 'babel-jest',
  },
  moduleNameMapper: {
    // Mock next/font (requires Next.js build pipeline, not available in Jest)
    '^next/font/(.*)$': '<rootDir>/__mocks__/nextFontMock.js',
    '^next/image$': '<rootDir>/__mocks__/nextImageMock.js',
    // Handle CSS / static assets
    '\\.(css|less|scss|sass)$': '<rootDir>/__mocks__/styleMock.js',
    '\\.(jpg|jpeg|png|gif|svg|webp|ico)$': '<rootDir>/__mocks__/fileMock.js',
  },
  coverageReporters: ['json-summary', 'text'],
};

module.exports = config;
