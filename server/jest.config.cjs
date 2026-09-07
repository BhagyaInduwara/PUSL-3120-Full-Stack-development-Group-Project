/**
 * Jest runs the whole server test suite in plain CommonJS via ts-jest,
 * overriding the app's own NodeNext/ESM tsconfig (see tsconfig.jest.json)
 * — the standard, well-trodden way to test a NodeNext-style TS project
 * with Jest without needing Jest's still-experimental native-ESM mode.
 * moduleNameMapper strips the ".js" extension our NodeNext imports use
 * (e.g. "../app.js") so Jest's resolver finds the sibling ".ts" source
 * file instead of a compiled output that doesn't exist at test time.
 */
module.exports = {
  testEnvironment: "node",
  rootDir: ".",
  testMatch: ["<rootDir>/src/**/__tests__/**/*.test.ts"],
  transform: {
    "^.+\\.ts$": ["ts-jest", { tsconfig: "<rootDir>/tsconfig.jest.json" }],
  },
  moduleFileExtensions: ["ts", "js", "json"],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  globalSetup: "<rootDir>/src/__tests__/globalSetup.ts",
  globalTeardown: "<rootDir>/src/__tests__/globalTeardown.ts",
  setupFiles: ["<rootDir>/src/__tests__/setupEnv.ts"],
  setupFilesAfterEnv: ["<rootDir>/src/__tests__/setupTestDb.ts"],
  testTimeout: 30000,
  clearMocks: true,
};
