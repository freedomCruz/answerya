import { describe, expect, it } from "vitest";

import { RESULT_KIND, err, isErr, isOk, ok } from "../shared/result.js";

describe("Result", () => {
  it("ok() produces an Ok variant with kind RESULT_KIND.OK", () => {
    const result = ok(42);

    expect(result.kind).toBe(RESULT_KIND.OK);
    expect(result.value).toBe(42);
  });

  it("err() produces an Err variant with kind RESULT_KIND.ERR", () => {
    const result = err("boom");

    expect(result.kind).toBe(RESULT_KIND.ERR);
    expect(result.error).toBe("boom");
  });

  it("isOk() narrows an Ok variant and rejects an Err variant", () => {
    const okResult = ok("value");
    const errResult = err("failure");

    expect(isOk(okResult)).toBe(true);
    expect(isOk(errResult)).toBe(false);
  });

  it("isErr() narrows an Err variant and rejects an Ok variant", () => {
    const okResult = ok("value");
    const errResult = err("failure");

    expect(isErr(errResult)).toBe(true);
    expect(isErr(okResult)).toBe(false);
  });

  it("never throws — failure is represented as a return value", () => {
    function divide(a: number, b: number) {
      if (b === 0) return err("division_by_zero" as const);
      return ok(a / b);
    }

    const result = divide(10, 0);

    expect(() => divide(10, 0)).not.toThrow();
    expect(isErr(result)).toBe(true);
  });
});
