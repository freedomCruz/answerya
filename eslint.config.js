// @answerya workspace ESLint flat config.
//
// Enforces the hexagonal boundary from design D4: `packages/core` MUST NOT
// import from `packages/adapters` (relative traversal) or the banned bare
// specifiers below. Turborepo runs `lint` per package, so `basePath` below
// is pinned to this file's own location rather than `process.cwd()` — a
// cwd-relative `basePath` would silently match nothing and the guard would
// pass without ever checking anything.
import { fileURLToPath } from "node:url";
import path from "node:path";

import js from "@eslint/js";
import tseslint from "typescript-eslint";
import importX from "eslint-plugin-import-x";
import { createTypeScriptImportResolver } from "eslint-import-resolver-typescript";
import prettierPlugin from "eslint-plugin-prettier";
import prettierConfig from "eslint-config-prettier";

const REPO_ROOT = path.dirname(fileURLToPath(import.meta.url));

export default tseslint.config(
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.next/**",
      "**/.turbo/**",
      "**/coverage/**",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    // Runs Prettier as a lint rule so `pnpm lint` also enforces formatting
    // (spec requirement: "Formatting violations fail lint").
    files: ["**/*.{ts,tsx,js,mjs,cjs}"],
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      "prettier/prettier": "error",
    },
  },
  // Disables ESLint stylistic rules that would conflict with Prettier;
  // must come after the rule sets it overrides.
  prettierConfig,
  {
    files: ["**/*.{ts,tsx}"],
    plugins: {
      "import-x": importX,
    },
    settings: {
      // Resolves relative `.js`-suffixed specifiers to their `.ts` source
      // (nodenext convention) so `import-x/no-restricted-paths` can see the
      // real target file instead of silently failing to resolve.
      "import-x/resolver-next": [createTypeScriptImportResolver()],
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  {
    // Core purity guard (D4): what pnpm resolution and the TS project
    // boundary let through, ESLint catches here.
    files: ["packages/core/**/*.{ts,tsx}"],
    rules: {
      "import-x/no-restricted-paths": [
        "error",
        {
          basePath: REPO_ROOT,
          zones: [
            {
              target: "packages/core/src",
              from: "packages/adapters",
            },
          ],
        },
      ],
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            "@answerya/adapters*",
            "@answerya/contracts*",
            "zod",
            "drizzle-orm",
            "node:*",
          ],
        },
      ],
    },
  },
);
