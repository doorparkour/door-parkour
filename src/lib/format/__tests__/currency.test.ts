import { describe, it, expect } from "vitest";
import { formatPriceDollars } from "../currency";

describe("formatPriceDollars", () => {
  it("formats cents to USD", () => {
    expect(formatPriceDollars(2500)).toBe("$25.00");
    expect(formatPriceDollars(0)).toBe("$0.00");
  });
});
