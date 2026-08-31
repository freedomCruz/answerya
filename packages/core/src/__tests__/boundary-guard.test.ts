// Regression guard for the core purity ESLint boundary (design D4, spec
// `domain-core` "Enforced Core-to-Adapters Import Ban", task 3.13).
//
// This test has failed open TWICE before in this project: once from an
// unpinned `basePath` (task 1.7), once from a missing TS-aware resolver.
// Both times ESLint reported ZERO violations, which looks identical to
// "everything is fine". This test makes that impossible to regress by
// lint-testing the fixture directly instead of trusting the config.
//
// `new ESLint({ ignore: false })` is mandatory: a file matched by flat
// config `ignores` is skipped entirely by `lintFiles`, which then returns
// only the warning "File ignored because of a matching ignore pattern"
// and ZERO rule messages. Without `ignore: false` this test would pass by
// asserting nothing.
//
// `cwd` is pinned to `packages/core` — the same cwd Turborepo uses when it
// fans `pnpm lint` out to this package's own `lint` script (`eslint .`),
// so a `basePath` regression in `eslint.config.js` is caught here rather
// than passing silently in some other cwd.
import path from "node:path";
import { fileURLToPath } from "node:url";

import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

const CORE_PACKAGE_DIR = path.dirname(path.dirname(path.dirname(fileURLToPath(import.meta.url))));
const FIXTURE_PATH = path.join(CORE_PACKAGE_DIR, "src/__fixtures__/adapter-import.fixture.ts");

describe("core purity ESLint boundary guard", () => {
  it("reports both no-restricted-paths and no-restricted-imports on the fixture", async () => {
    const eslint = new ESLint({
      cwd: CORE_PACKAGE_DIR,
      ignore: false,
    });

    const results = await eslint.lintFiles([FIXTURE_PATH]);

    expect(results).toHaveLength(1);

    const messages = results[0]?.messages ?? [];
    const ruleIds = messages.map((message) => message.ruleId);

    expect(ruleIds).toContain("import-x/no-restricted-paths");
    expect(ruleIds).toContain("no-restricted-imports");
  });
});
