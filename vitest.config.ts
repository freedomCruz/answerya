// Workspace Vitest configuration (task 3.9, design D10).
//
// Each entry is a package directory owning its own `vitest.config.ts`.
// `packages/core` (task 3.10), `packages/contracts`, and
// `packages/adapters` unit tests all run with no setup file — zero
// infrastructure, zero network, zero database (AC-6).
//
// `adapters:integration` is declared as an INERT PLACEHOLDER for this PR:
// its project name is reserved so the workspace shape stays stable, but it
// carries no `globalSetup` and matches no test files yet. PR#4 supplies
// the Testcontainers-backed `globalSetup` and the matching test files
// together — do not add either half here.
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
          exclude: ["src/**/*.integration.test.ts"],
        },
      },
      {
        test: {
          // No `include` pattern yet: no test matches until PR#4 adds
          // both `include` and `globalSetup` together.
          name: "adapters:integration",
          root: "packages/adapters",
          include: [],
        },
      },
    ],
  },
});
