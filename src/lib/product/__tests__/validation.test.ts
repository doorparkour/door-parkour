import { describe, it, expect } from "vitest";
import { parseProductInput, productError } from "../validation";

function productFormData(overrides: Record<string, string> = {}): FormData {
  const fd = new FormData();
  const defaults: Record<string, string> = {
    name: "Door Parkour T-Shirt",
    description: "Comfy",
    price: "25.00",
    inventory: "10",
    slug: "door-parkour-t-shirt-m",
    image_url: "",
    size: "M",
    ...overrides,
  };
  Object.entries(defaults).forEach(([k, v]) => fd.append(k, v));
  return fd;
}

describe("parseProductInput", () => {
  it("returns error when price is invalid", () => {
    const result = parseProductInput(productFormData({ price: "abc" }));
    expect(result.error).toBe("Please enter a valid price.");
    expect(result.data).toBeUndefined();
  });

  it("returns error when price is negative", () => {
    const result = parseProductInput(productFormData({ price: "-5" }));
    expect(result.error).toBe("Please enter a valid price.");
  });

  it("returns error when inventory is invalid (non-on-demand)", () => {
    const result = parseProductInput(productFormData({ inventory: "x" }));
    expect(result.error).toBe("Please enter a valid inventory (0 or greater).");
  });

  it("returns error when inventory is negative (non-on-demand)", () => {
    const result = parseProductInput(productFormData({ inventory: "-1" }));
    expect(result.error).toBe("Please enter a valid inventory (0 or greater).");
  });

  it("accepts empty inventory when on-demand", () => {
    const result = parseProductInput(productFormData({ inventory: "", on_demand: "on" }));
    expect(result.error).toBeUndefined();
    expect(result.data?.inventory).toBe(0);
  });

  it("returns error when slug is empty", () => {
    const result = parseProductInput(productFormData({ slug: "" }));
    expect(result.error).toBe("Slug is required.");
  });

  it("returns error when slug is whitespace only", () => {
    const result = parseProductInput(productFormData({ slug: "   " }));
    expect(result.error).toBe("Slug is required.");
  });

  it("parses valid input", () => {
    const result = parseProductInput(productFormData({ status: "active" }));
    expect(result.error).toBeUndefined();
    expect(result.data).toMatchObject({
      name: "Door Parkour T-Shirt",
      price_cents: 2500,
      inventory: 10,
      slug: "door-parkour-t-shirt-m",
      status: "active",
      on_demand: false,
      size: "M",
    });
  });

  it("defaults status to active when omitted", () => {
    const result = parseProductInput(productFormData());
    expect(result.data?.status).toBe("active");
  });

  it("parses draft status", () => {
    const result = parseProductInput(productFormData({ status: "draft" }));
    expect(result.data?.status).toBe("draft");
  });

  it("parses on_demand when checked", () => {
    const result = parseProductInput(productFormData({ on_demand: "on" }));
    expect(result.data?.on_demand).toBe(true);
  });
});

describe("productError", () => {
  it("returns user-friendly message for duplicate slug", () => {
    expect(
      productError("duplicate key value violates unique constraint 'products_slug_key'")
    ).toBe("A product with this slug already exists. Please choose a different slug.");
  });

  it("returns user-friendly message for duplicate name", () => {
    expect(productError("duplicate key for name")).toBe(
      "A product with this name and size already exists."
    );
  });

  it("returns generic message for check constraint", () => {
    expect(productError("violates check constraint")).toBe(
      "Invalid value. Please check price, inventory, or status."
    );
  });

  it("returns original message for unknown errors", () => {
    expect(productError("some other error")).toBe("some other error");
  });
});
