import { createJestPreset } from 'ts-jest';

const tsJestPreset = createJestPreset();

/** @type {import('jest').Config} */
const config = {
  ...tsJestPreset,
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        useESM: true,
      },
    ],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};

export default config;