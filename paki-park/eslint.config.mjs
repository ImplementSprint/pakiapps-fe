import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "tests/**"
  ]),
  // Jest config files must use CommonJS require() — disable the rule for them.
  {
    files: ["jest.config.js", "jest.setup.js", "__mocks__/**"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  {
    files: ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "react/no-unescaped-entities": "off",
      "react-hooks/exhaustive-deps": "off",
      "@typescript-eslint/no-empty-object-type": "off",
      "@next/next/no-img-element": "off",
      "prefer-const": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-unsafe-function-type": "off",
      "@typescript-eslint/no-non-null-asserted-optional-chain": "off",
      "react/jsx-no-target-blank": "off",
      "react/display-name": "off",
      "react/prop-types": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/purity": "off",
      "jsx-a11y/alt-text": "off",
      "@typescript-eslint/no-unused-expressions": "off",
      "react-hooks/rules-of-hooks": "off",
      "react-compiler/react-compiler": "off",
      "@next/next/no-page-custom-font": "off",
      "react-hooks/refs": "off",
      "react-hooks/immutability": "off"
    }
  }
]);

export default eslintConfig;
