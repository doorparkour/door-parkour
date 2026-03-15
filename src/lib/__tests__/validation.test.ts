import { describe, it, expect } from "vitest";
import { unwrap } from "../validation";

describe("unwrap", () => {
  it("returns data when present", () => {
    const result = unwrap({ data: { foo: "bar" } });
    expect(result).toEqual({ foo: "bar" });
  });

  it("throws when error is set", () => {
    expect(() => unwrap({ error: "Invalid input" })).toThrow("Invalid input");
  });

  it("throws when data is undefined and no error", () => {
    expect(() => unwrap({})).toThrow("Validation failed");
  });
});
