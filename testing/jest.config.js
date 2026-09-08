/* eslint-disable @typescript-eslint/no-require-imports -- CJS config file; next/jest itself is CommonJS */
const path = require("path");
const nextJest = require("next/jest");

/**
 * next/jest auto-configures Jest with the same SWC compiler Next.js itself
 * uses (JSX/TS transforms, CSS Modules, next/font mocks, etc.) — the
 * officially recommended way to set up Jest in a Next.js App Router
 * project, avoiding a hand-rolled Babel/ts-jest config. `dir` points back
 * at the repo root (as an absolute path — next/jest resolves it relative
 * to process.cwd(), not this config file's own location, which would
 * silently point one directory too far up if resolved relatively) so it
 * finds next.config.ts/tsconfig.json from there.
 */
const createJestConfig = nextJest({ dir: path.resolve(__dirname, "..") });

/** @type {import('jest').Config} */
const customJestConfig = {
  testEnvironment: "jest-environment-jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  rootDir: ".",
  roots: ["<rootDir>/unit"],
  testMatch: ["<rootDir>/unit/**/*.test.tsx"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/../src/$1",
  },
};

module.exports = createJestConfig(customJestConfig);
