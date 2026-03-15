import { describe, it, expect } from "vitest";
import { groupProducts } from "../grouping";

function product(overrides: Partial<{ id: string; name: string; size: string | null }> = {}) {
  return {
    id: "prod-1",
    name: "Door Parkour T-Shirt",
    description: null,
    price_cents: 2500,
    image_url: null,
    inventory: 10,
    slug: "door-parkour-t-shirt-m",
    status: "active" as const,
    on_demand: false,
    size: "M" as string | null,
    created_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("groupProducts", () => {
  it("groups apparel by base name when products have size", () => {
    const products = [
      product({ id: "p1", name: "Door Parkour T-Shirt", size: "M" }),
      product({ id: "p2", name: "Door Parkour T-Shirt", size: "L" }),
      product({ id: "p3", name: "Door Parkour Hoodie", size: "S" }),
    ];
    const { apparel, accessories } = groupProducts(products);

    expect(apparel.size).toBe(2);
    expect(apparel.get("Door Parkour T-Shirt")).toHaveLength(2);
    expect(apparel.get("Door Parkour Hoodie")).toHaveLength(1);
    expect(accessories).toHaveLength(0);
  });

  it("puts products without size in accessories", () => {
    const products = [
      product({ id: "p1", name: "Door Parkour T-Shirt", size: "M" }),
      product({ id: "p2", name: "Door Parkour Water Bottle", size: null }),
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
