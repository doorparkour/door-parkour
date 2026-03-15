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
  it("separates apparel (sized variants) from accessories (no size)", () => {
    const products = [
      product({
        id: "p1",
        name: "Door Parkour T-Shirt",
        slug: "door-parkour-t-shirt",
        product_variants: [{ size: "M" }, { size: "L" }],
      }),
      product({
        id: "p2",
        name: "Door Parkour Hoodie",
        slug: "door-parkour-hoodie",
        product_variants: [{ size: "S" }],
      }),
    ];
    const { apparel, accessories } = groupProducts(products);

    expect(apparel).toHaveLength(2);
    expect(accessories).toHaveLength(0);
  });

  it("shows each product with unique slug as separate item", () => {
    const products = [
      product({
        id: "p1",
        slug: "door-parkour-t-shirt",
        product_variants: [{ size: "M" }],
      }),
      product({
        id: "p2",
        slug: "door-parkour-t-shirt-od",
        product_variants: [{ size: "M" }],
      }),
    ];
    const { apparel } = groupProducts(products);
    expect(apparel).toHaveLength(2);
    expect(apparel.map((p) => p.slug)).toEqual([
      "door-parkour-t-shirt",
      "door-parkour-t-shirt-od",
    ]);
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

    expect(apparel).toHaveLength(1);
    expect(accessories).toHaveLength(1);
    expect(accessories[0].name).toBe("Door Parkour Water Bottle");
  });

  it("returns empty arrays when given no products", () => {
    const { apparel, accessories } = groupProducts([]);
    expect(apparel).toHaveLength(0);
    expect(accessories).toHaveLength(0);
  });
});
