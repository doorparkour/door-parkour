type Product = {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  inventory: number;
  on_demand: boolean;
  image_url: string | null;
};

export type CartItem = {
  productId: string;
  quantity: number;
};

export function validateCart(
  items: CartItem[],
  products: Product[]
): { error: string } | null {
  if (!items || items.length === 0) {
    return { error: "Cart is empty" };
  }

  const missingId = items.find((i) => !products.find((p) => p.id === i.productId))?.productId;
  if (missingId) {
    return { error: `Product ${missingId} not found` };
  }

  const stockError = items.reduce<string | null>((acc, i) => {
    if (acc) return acc;
    const p = products.find((p) => p.id === i.productId)!;
    if (p.on_demand) return null;
    if (p.inventory === 0) return `${p.name} is out of stock`;
    if (i.quantity > p.inventory) return `Only ${p.inventory} of ${p.name} available`;
    return null;
  }, null);

  return stockError ? { error: stockError } : null;
}

export function buildLineItems(
  items: CartItem[],
  products: Product[]
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
    const product = products.find((p) => p.id === cartItem.productId)!;
    return {
      price_data: {
        currency: "usd",
        product_data: {
          name: product.name,
          description: product.description ?? undefined,
          images: product.image_url ? [product.image_url] : undefined,
        },
        unit_amount: product.price_cents,
      },
      quantity: cartItem.quantity,
    };
  });
}

export function calculateTotalCents(items: CartItem[], products: Product[]): number {
  return items.reduce((sum, cartItem) => {
    const product = products.find((p) => p.id === cartItem.productId)!;
    return sum + product.price_cents * cartItem.quantity;
  }, 0);
}
