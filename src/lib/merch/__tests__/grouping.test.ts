import { describe, it, expect } from "vitest";
import { groupProducts } from "../grouping";

function product(
  overrides: Partial<{
    id: string;
    name: string;
    product_variants: { size: string | null }[];
  }> = {}
) {
  return {
    id: "prod-1",
    name: "Door Parkour T-Shirt",
    description: null,
    price_cents: 2500,
    image_url: null,
    slug: "door-parkour-t-shirt",
    status: "active" as const,
    on_demand: false,
    created_at: "2026-01-01T00:00:00Z",
    product_variants: [{ size: "M" }],
    ...overrides,
  };
}

describe("groupProducts", () => {
  it("groups apparel by base name when products have sized variants", () => {
    const products = [
      product({
        id: "p1",
        name: "Door Parkour T-Shirt",
        product_variants: [{ size: "M" }, { size: "L" }],
      }),
      product({
        id: "p2",
        name: "Door Parkour Hoodie",
        product_variants: [{ size: "S" }],
      }),
    ];
    const { apparel, accessories } = groupProducts(products);

    expect(apparel.size).toBe(2);
    expect(apparel.get("Door Parkour T-Shirt")).toHaveLength(1);
    expect(apparel.get("Door Parkour Hoodie")).toHaveLength(1);
    expect(accessories).toHaveLength(0);
  });

  it("puts products without sized variants in accessories", () => {
    const products = [
      product({
        id: "p1",
        name: "Door Parkour T-Shirt",
        product_variants: [{ size: "M" }],
      }),
      product({
        id: "p2",
        name: "Door Parkour Water Bottle",
        product_variants: [{ size: null }],
      }),
    ];
    const { apparel, accessories } = groupProducts(products);

    expect(apparel.size).toBe(1);
    expect(apparel.get("Door Parkour T-Shirt")).toHaveLength(1);
    expect(accessories).toHaveLength(1);
    expect(accessories[0].name).toBe("Door Parkour Water Bottle");
  });

  it("returns empty maps when given no products", () => {
    const { apparel, accessories } = groupProducts([]);
    expect(apparel.size).toBe(0);
    expect(accessories).toHaveLength(0);
  });
});
