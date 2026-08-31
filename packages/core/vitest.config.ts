// @answerya/core Vitest configuration (task 3.10, design D10).
//
// No setup file, no globalSetup — packages/core has zero runtime
// dependencies and no adapter imports, so its tests run with zero
// infrastructure (AC-6). This file is what makes `pnpm --filter
// @answerya/core test` and the root `adapters:unit`/`core` project entry
// both resolve to the same test set.
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    name: "core",
    include: ["src/**/*.test.ts"],
  },
});
