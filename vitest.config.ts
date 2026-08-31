// Workspace Vitest configuration (task 3.9, design D10).
//
// `packages/core` and `packages/contracts` are directory-string entries
// (each owns its own single-project `vitest.config.ts`). `packages/adapters`
// is declared inline as two named projects instead, because Vitest 4 does
// not merge a nested `test.projects` array from a referenced package
// config — only its top-level `test` config would apply, silently
// dropping the `adapters:integration` project and its `globalSetup`.
// `adapters:unit` runs with zero infrastructure (AC-6); `adapters:integration`
// owns the Testcontainers-backed setup (task 4.19–4.20) and is the only
// project that ever touches Postgres.
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      "packages/core",
      "packages/contracts",
      {
        test: {
          name: "adapters:unit",
          root: "packages/adapters",
          include: ["src/**/*.test.ts"],
        },
      },
      {
        test: {
          name: "adapters:integration",
          root: "packages/adapters",
          include: ["test/integration/**/*.test.ts"],
          globalSetup: ["test/integration/global-setup.ts"],
          hookTimeout: 60_000,
          testTimeout: 30_000,
        },
      },
    ],
  },
});
