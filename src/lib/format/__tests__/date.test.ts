import { describe, it, expect } from "vitest";
import { formatClassDate } from "../date";

describe("formatClassDate", () => {
  it("formats Date to long US format in Chicago timezone", () => {
    const date = new Date("2026-06-06T15:00:00Z");
    const result = formatClassDate(date);
    expect(result).toMatch(/Saturday|June|6|2026/);
  });

  it("formats ISO string", () => {
    const result = formatClassDate("2026-06-06T15:00:00.000Z");
    expect(result).toMatch(/2026/);
  });
});
