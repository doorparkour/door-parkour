import { describe, it, expect } from "vitest";
import {
  parseProductInput,
  parseVariantInputs,
  productError,
} from "../validation";

function productFormData(overrides: Record<string, string> = {}): FormData {
  const fd = new FormData();
  const defaults: Record<string, string> = {
    name: "Door Parkour T-Shirt",
    description: "Comfy",
    price: "25.00",
    slug: "door-parkour-t-shirt",
    image_url: "",
    on_demand: "",
    inventory_M: "10",
    inventory_L: "5",
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
      slug: "door-parkour-t-shirt",
      status: "active",
      on_demand: false,
    });
    expect(result.data).not.toHaveProperty("inventory");
    expect(result.data).not.toHaveProperty("size");
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

describe("parseVariantInputs", () => {
  it("parses apparel variants (inventory per size)", () => {
    const fd = productFormData({
      inventory_XS: "1",
      inventory_S: "2",
      inventory_M: "3",
      inventory_L: "4",
      inventory_XL: "5",
      inventory_XXL: "6",
    });
    const result = parseVariantInputs(fd, true);
    expect(result.error).toBeUndefined();
    expect(result.data).toHaveLength(6);
    expect(result.data?.[0]).toEqual({ size: "XS", inventory: 1 });
    expect(result.data?.[2]).toEqual({ size: "M", inventory: 3 });
  });

  it("parses accessory variant (single inventory)", () => {
    const fd = productFormData({ inventory: "10" });
    const result = parseVariantInputs(fd, false);
    expect(result.error).toBeUndefined();
    expect(result.data).toHaveLength(1);
    expect(result.data?.[0]).toEqual({ size: null, inventory: 10 });
  });

  it("returns error when inventory is invalid", () => {
    const fd = productFormData({ inventory_M: "x" });
    const result = parseVariantInputs(fd, true);
    expect(result.error).toContain("valid inventory");
  });
});

describe("productError", () => {
  it("returns user-friendly message for duplicate slug", () => {
    expect(
      productError(
        "duplicate key value violates unique constraint 'products_slug_key'"
      )
    ).toBe(
      "A product with this slug already exists. Please choose a different slug."
    );
  });

  it("returns user-friendly message for duplicate product_variants", () => {
    expect(
      productError("duplicate key for product_variants")
    ).toBe("A variant with this size already exists.");
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
