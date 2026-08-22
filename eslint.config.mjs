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
    // server/ is a separate Express + Mongoose project (its own
    // package.json/tsconfig, not part of this Next.js app) — Next's
    // frontend-oriented rules (core-web-vitals, etc.) don't apply to it.
    "server/**",
  ]),
]);

export default eslintConfig;
