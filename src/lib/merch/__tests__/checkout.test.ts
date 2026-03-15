import { describe, it, expect } from "vitest";
import {
  validateCart,
  buildLineItems,
  calculateTotalCents,
  type CartItem,
} from "../checkout";

const products = [
  {
    id: "p1",
    name: "Tee",
    description: null,
    price_cents: 2500,
    inventory: 10,
    on_demand: false,
    image_url: null,
  },
  {
    id: "p2",
    name: "Hoodie",
    description: "Warm",
    price_cents: 5000,
    inventory: 0,
    on_demand: true,
    image_url: null,
  },
];

describe("validateCart", () => {
  it("returns error when cart is empty", () => {
    expect(validateCart([], products)).toEqual({ error: "Cart is empty" });
  });

  it("returns error when product not found", () => {
    expect(
      validateCart([{ productId: "unknown", quantity: 1 }], products)
    ).toEqual({ error: "Product unknown not found" });
  });

  it("returns error when limited product out of stock", () => {
    expect(
      validateCart([{ productId: "p1", quantity: 1 }], [
        { ...products[0], inventory: 0 },
      ])
    ).toEqual({ error: "Tee is out of stock" });
  });

  it("returns error when quantity exceeds inventory", () => {
    expect(
      validateCart([{ productId: "p1", quantity: 11 }], products)
    ).toEqual({ error: "Only 10 of Tee available" });
  });

  it("allows on-demand product with zero inventory", () => {
    expect(
      validateCart([{ productId: "p2", quantity: 5 }], products)
    ).toBeNull();
  });

  it("returns null when valid", () => {
    expect(validateCart([{ productId: "p1", quantity: 2 }], products)).toBeNull();
  });
});

describe("buildLineItems", () => {
  it("builds Stripe line items from cart", () => {
    const items: CartItem[] = [{ productId: "p1", quantity: 2 }];
    const result = buildLineItems(items, products);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      price_data: {
        currency: "usd",
        product_data: { name: "Tee" },
        unit_amount: 2500,
      },
      quantity: 2,
    });
  });
});

describe("calculateTotalCents", () => {
  it("sums product price * quantity", () => {
    const items: CartItem[] = [
      { productId: "p1", quantity: 2 },
      { productId: "p2", quantity: 1 },
    ];
    expect(calculateTotalCents(items, products)).toBe(10000);
  });
});
