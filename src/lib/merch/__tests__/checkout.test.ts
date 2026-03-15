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
    on_demand: false,
    image_url: null,
  },
  {
    id: "p2",
    name: "Hoodie",
    description: "Warm",
    price_cents: 5000,
    on_demand: true,
    image_url: null,
  },
];

const variants = [
  { id: "v1", product_id: "p1", size: "M" as string | null, inventory: 10 },
  { id: "v2", product_id: "p2", size: null as string | null, inventory: 0 },
];

describe("validateCart", () => {
  it("returns error when cart is empty", () => {
    expect(validateCart([], products, variants)).toEqual({
      error: "Cart is empty",
    });
  });

  it("returns error when variant not found", () => {
    expect(
      validateCart(
        [{ variantId: "unknown", productId: "p1", quantity: 1 }],
        products,
        variants
      )
    ).toEqual({ error: "A cart item is no longer available" });
  });

  it("returns error when limited product out of stock", () => {
    expect(
      validateCart(
        [{ variantId: "v1", productId: "p1", quantity: 1 }],
        products,
        [{ ...variants[0], inventory: 0 }]
      )
    ).toEqual({ error: "Tee is out of stock" });
  });

  it("returns error when quantity exceeds inventory", () => {
    expect(
      validateCart(
        [{ variantId: "v1", productId: "p1", quantity: 11 }],
        products,
        variants
      )
    ).toEqual({ error: "Only 10 of Tee available" });
  });

  it("allows on-demand product with zero inventory", () => {
    expect(
      validateCart(
        [{ variantId: "v2", productId: "p2", quantity: 5 }],
        products,
        variants
      )
    ).toBeNull();
  });

  it("returns null when valid", () => {
    expect(
      validateCart(
        [{ variantId: "v1", productId: "p1", quantity: 2 }],
        products,
        variants
      )
    ).toBeNull();
  });
});

describe("buildLineItems", () => {
  it("builds Stripe line items from cart", () => {
    const items: CartItem[] = [
      { variantId: "v1", productId: "p1", quantity: 2 },
    ];
    const result = buildLineItems(items, products, variants);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      price_data: {
        currency: "usd",
        product_data: { name: "Tee (M)" },
        unit_amount: 2500,
      },
      quantity: 2,
    });
  });
});

describe("calculateTotalCents", () => {
  it("sums product price * quantity", () => {
    const items: CartItem[] = [
      { variantId: "v1", productId: "p1", quantity: 2 },
      { variantId: "v2", productId: "p2", quantity: 1 },
    ];
    expect(calculateTotalCents(items, products, variants)).toBe(10000);
  });
});
