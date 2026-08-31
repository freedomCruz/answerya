import { describe, expect, it } from "vitest";

import type { Clock } from "../shared/clock.js";

describe("Clock", () => {
  it("is substitutable — a fixed-time fake satisfies the interface", () => {
    const fixedDate = new Date("2026-01-01T00:00:00.000Z");
    const fakeClock: Clock = {
      now: () => fixedDate,
    };

    expect(fakeClock.now()).toBe(fixedDate);
  });

  it("allows domain logic to depend on the abstraction, not on Date directly", () => {
    function timestamp(clock: Clock): number {
      return clock.now().getTime();
    }

    const fakeClock: Clock = { now: () => new Date("2026-06-15T12:00:00.000Z") };

    expect(timestamp(fakeClock)).toBe(new Date("2026-06-15T12:00:00.000Z").getTime());
  });
});
