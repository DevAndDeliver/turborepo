import baseConfig from "@repo/config/eslint.config.js";

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...baseConfig,
  {
    rules: {
      "@typescript-eslint/explicit-function-return-type": "warn",
      // @typescript-eslint/no-floating-promises requires type-aware linting.
      // Enable by adding parserOptions.project: https://typescript-eslint.io/getting-started/typed-linting
    },
  },
];
