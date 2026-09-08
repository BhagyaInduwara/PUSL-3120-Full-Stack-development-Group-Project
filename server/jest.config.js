/**
 * Jest config for the Express + Mongoose backend.
 *
 * A few things here exist for non-obvious reasons — worth reading before
 * changing:
 *
 * 1. Real ESM, not CommonJS. `src/app.ts` has a top-level `await connectDB()`
 *    — valid only in native ESM, not in CommonJS (no async wrapper there).
 *    So this can't use ts-jest's default CJS transform; it has to run Jest
 *    itself in native-ESM mode (`useESM: true` below + `node
 *    --experimental-vm-modules` in package.json's "test" script).
 * 2. `moduleNameMapper` strips the trailing ".js" from relative imports
 *    (e.g. `from "../models/Order.js"`) so Jest's resolver finds the actual
 *    `Order.ts` source file. The app imports with ".js" extensions because
 *    tsconfig.json targets NodeNext, which requires that in real ESM output
 *    — ts-jest compiles straight from the .ts files, so the extension in
 *    the import specifier doesn't match a file that exists on disk unless
 *    this mapping rewrites it.
 * 3. `maxWorkers: 1` — every test file shares the ONE in-memory MongoDB
 *    instance started once in globalSetup.ts. Running test files in
 *    parallel would let them clear/write the same collections out from
 *    under each other.
 */
export default {
  testEnvironment: "node",
  extensionsToTreatAsEsm: [".ts"],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        useESM: true,
        tsconfig: "tsconfig.test.json",
      },
    ],
  },
  testMatch: ["<rootDir>/tests/**/*.test.ts"],
  globalSetup: "<rootDir>/tests/globalSetup.ts",
  globalTeardown: "<rootDir>/tests/globalTeardown.ts",
  maxWorkers: 1,
  testTimeout: 30000,
};
