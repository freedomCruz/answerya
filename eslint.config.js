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
      // Next.js auto-generates and regenerates this file on every build; it
      // is explicitly documented as "should not be edited" and its
      // triple-slash references are Next.js's own convention, not ours.
      "**/next-env.d.ts",
      // Deliberately violates the core purity guard (task 3.12) so the
      // guard itself can be lint-tested (task 3.13). Excluded here so it
      // never fails `pnpm lint`; the test re-lints it directly with
      // `new ESLint({ ignore: false })` to bypass this exact entry.
      "packages/core/src/__fixtures__/adapter-import.fixture.ts",
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
    // boundary let through, ESLint catches here. Scoped to shipped domain
    // source under `src/`, excluding `__tests__/`: the guard's own test
    // tooling (task 3.13) legitimately uses `node:*` to compute a fixture
    // path and invoke ESLint programmatically — it verifies the boundary,
    // it does not cross it. The fixture under `__fixtures__/` stays
    // in-zone deliberately (task 3.12) and is excluded only via the
    // top-level `ignores` above, so it is still lint-tested directly.
    files: ["packages/core/src/**/*.{ts,tsx}"],
    ignores: ["packages/core/src/__tests__/**"],
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
