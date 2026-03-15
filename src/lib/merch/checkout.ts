type Product = {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  on_demand: boolean;
  image_url: string | null;
};

type Variant = {
  id: string;
  product_id: string;
  size: string | null;
  inventory: number;
};

export type CartItem = {
  variantId: string;
  productId: string;
  quantity: number;
};

export function validateCart(
  items: CartItem[],
  products: Product[],
  variants: Variant[]
): { error: string } | null {
  if (!items || items.length === 0) {
    return { error: "Cart is empty" };
  }

  const missingVariant = items.find(
    (i) => !variants.find((v) => v.id === i.variantId))
    ?.variantId;
  if (missingVariant) {
    return { error: "A cart item is no longer available" };
  }

  const stockError = items.reduce<string | null>((acc, i) => {
    if (acc) return acc;
    const v = variants.find((v) => v.id === i.variantId)!;
    const p = products.find((p) => p.id === v.product_id)!;
    if (p.on_demand) return null;
    if (v.inventory === 0) return `${p.name} is out of stock`;
    if (i.quantity > v.inventory) return `Only ${v.inventory} of ${p.name} available`;
    return null;
  }, null);

  return stockError ? { error: stockError } : null;
}

export function buildLineItems(
  items: CartItem[],
  products: Product[],
  variants: Variant[]
): Array<{
  price_data: {
    currency: string;
    product_data: {
      name: string;
      description?: string;
      images?: string[];
    };
    unit_amount: number;
  };
  quantity: number;
}> {
  return items.map((cartItem) => {
    const v = variants.find((v) => v.id === cartItem.variantId)!;
    const product = products.find((p) => p.id === v.product_id)!;
    const sizeLabel = v.size ? ` (${v.size})` : "";
    return {
      price_data: {
        currency: "usd",
        product_data: {
          name: `${product.name}${sizeLabel}`,
          description: product.description ?? undefined,
          images: product.image_url ? [product.image_url] : undefined,
        },
        unit_amount: product.price_cents,
      },
      quantity: cartItem.quantity,
    };
  });
}

export function calculateTotalCents(
  items: CartItem[],
  products: Product[],
  variants: Variant[]
): number {
  return items.reduce((sum, cartItem) => {
    const v = variants.find((v) => v.id === cartItem.variantId)!;
    const product = products.find((p) => p.id === v.product_id)!;
    return sum + product.price_cents * cartItem.quantity;
  }, 0);
}
