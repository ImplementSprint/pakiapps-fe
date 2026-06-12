import nextJest from "next/jest.js";

const createJestConfig = nextJest({
  dir: "./"
});

const customJestConfig = {
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testEnvironment: "jsdom",
  collectCoverageFrom: [
    "<rootDir>/src/features/utils/pricingCalculations.ts"
  ],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^react-router$": "<rootDir>/src/lib/react-router-compat.tsx"
  }
};

export default createJestConfig(customJestConfig);
