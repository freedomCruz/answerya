// Fixture for the core purity guard test (task 3.13, spec `domain-core`
// "Enforced Core-to-Adapters Import Ban"). Deliberately violates the
// boundary in two distinct ways so the ESLint test can assert both rule
// ids fire:
//
// 1. A relative traversal out of `packages/core/src` into
//    `packages/adapters` — caught by `import-x/no-restricted-paths`
//    (the zone rule).
// 2. A bare `@answerya/adapters` specifier — caught by
//    `no-restricted-imports`.
//
// This file is EXCLUDED from both `pnpm lint` (eslint.config.js `ignores`)
// and `pnpm typecheck` (`packages/core/tsconfig.json` `exclude`), so it
// can never break the build. It exists only to be lint-tested directly by
// task 3.13's Vitest test with `new ESLint({ ignore: false })`.

// Intentional violation (relative traversal) — must NOT be suppressed with
// an eslint-disable comment, or the guard test below would assert nothing.
import { placeholder as relativePlaceholder } from "../../../adapters/src/index.js";
// Intentional violation (bare specifier) — must NOT be suppressed with an
// eslint-disable comment, or the guard test below would assert nothing.
import { placeholder as barePlaceholder } from "@answerya/adapters";

export const fixtureUsage = [relativePlaceholder, barePlaceholder];
