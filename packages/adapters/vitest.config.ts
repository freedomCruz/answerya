// @answerya/adapters Vitest configuration (task 4.19, design D10).
//
// Two projects: `adapters:unit` runs with zero infrastructure;
// `adapters:integration` owns the Testcontainers `globalSetup` (task
// 4.20) and is the only project that ever touches Postgres.
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "adapters:unit",
          include: ["src/**/*.test.ts"],
        },
      },
      {
        test: {
          name: "adapters:integration",
          include: ["test/integration/**/*.test.ts"],
          globalSetup: ["test/integration/global-setup.ts"],
          hookTimeout: 60_000,
          testTimeout: 30_000,
        },
      },
    ],
  },
});
