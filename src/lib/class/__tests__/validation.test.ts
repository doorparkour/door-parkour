import { describe, it, expect } from "vitest";
import { parseClassInput } from "../validation";

function classFormData(overrides: Record<string, string> = {}): FormData {
  const fd = new FormData();
  const defaults: Record<string, string> = {
    title: "Intro to Parkour",
    description: "Great class",
    location: "Sunset Park",
    starts_at: "2026-06-06T10:00",
    duration_mins: "90",
    capacity: "8",
    price: "45.00",
    age_group: "adult",
    ...overrides,
  };
  Object.entries(defaults).forEach(([k, v]) => fd.append(k, v));
  return fd;
}

describe("parseClassInput", () => {
  describe("requireFutureDate: true (create)", () => {
    it("returns error when starts_at is in the past", () => {
      const result = parseClassInput(classFormData({ starts_at: "2020-01-01T10:00" }), {
        requireFutureDate: true,
      });
      expect(result.error).toBe("Class must be scheduled in the future.");
    });

    it("returns error when starts_at is invalid", () => {
      const result = parseClassInput(classFormData({ starts_at: "not-a-date" }), {
        requireFutureDate: true,
      });
      expect(result.error).toBe("Invalid date format. Use the date picker.");
    });
  });

  describe("requireFutureDate: false (update)", () => {
    it("accepts past date", () => {
      const result = parseClassInput(classFormData({ starts_at: "2020-01-01T10:00" }));
      expect(result.error).toBeUndefined();
      expect(result.data?.starts_at).toBe("2020-01-01T10:00");
    });
  });

  it("returns error when price is invalid", () => {
    const result = parseClassInput(classFormData({ price: "abc" }));
    expect(result.error).toBe("Invalid price.");
  });

  it("returns error when price is negative", () => {
    const result = parseClassInput(classFormData({ price: "-10" }));
    expect(result.error).toBe("Invalid price.");
  });

  it("returns error when age_group is invalid", () => {
    const result = parseClassInput(classFormData({ age_group: "senior" }));
    expect(result.error).toBe("Invalid age group.");
  });

  it("parses valid input", () => {
    const result = parseClassInput(classFormData({ is_published: "on" }));
    expect(result.error).toBeUndefined();
    expect(result.data).toMatchObject({
      title: "Intro to Parkour",
      location: "Sunset Park",
      starts_at: "2026-06-06T10:00",
      duration_mins: 90,
      capacity: 8,
      spots_remaining: 8,
      price_cents: 4500,
      is_published: true,
      age_group: "adult",
    });
  });

  it("defaults age_group to adult when omitted", () => {
    const result = parseClassInput(classFormData());
    expect(result.data?.age_group).toBe("adult");
  });

  it("parses age_group youth", () => {
    const result = parseClassInput(classFormData({ age_group: "youth" }));
    expect(result.data?.age_group).toBe("youth");
  });

  it("is_published false when not checked", () => {
    const result = parseClassInput(classFormData());
    expect(result.data?.is_published).toBe(false);
  });
});
