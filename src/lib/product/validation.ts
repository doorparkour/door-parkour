export type ProductInput = {
  name: string;
  description: string | null;
  price_cents: number;
  slug: string;
  image_url: string | null;
  status: "active" | "draft" | "archived";
  on_demand: boolean;
};

export type VariantInput = {
  size: string | null;
  inventory: number;
};

export function parseProductInput(
  formData: FormData
): { data?: ProductInput; error?: string } {
  const priceCents = Math.round(
    parseFloat((formData.get("price") as string) || "0") * 100
  );
  if (Number.isNaN(priceCents) || priceCents < 0) {
    return { error: "Please enter a valid price." };
  }

  const slug = (formData.get("slug") as string)?.trim();
  if (!slug) {
    return { error: "Slug is required." };
  }

  const status = ((formData.get("status") as string) ||
    "active") as "active" | "draft" | "archived";

  return {
    data: {
      name: formData.get("name") as string,
      description: (formData.get("description") as string) || null,
      price_cents: priceCents,
      slug,
      image_url: (formData.get("image_url") as string) || null,
      status,
      on_demand: formData.get("on_demand") === "on",
    },
  };
}

export function parseVariantInputs(
  formData: FormData,
  isApparel: boolean
): { data?: VariantInput[]; error?: string } {
  const onDemand = formData.get("on_demand") === "on";
  const sizes = isApparel ? ["XS", "S", "M", "L", "XL", "XXL"] : [null];

  const variants: VariantInput[] = [];
  for (const size of sizes) {
    const key = size ? `inventory_${size}` : "inventory";
    const raw = formData.get(key) as string;
    const inventory = raw ? parseInt(raw) : 0;
    if (!onDemand && (Number.isNaN(inventory) || inventory < 0)) {
      return {
        error: `Please enter a valid inventory for ${size ?? "this product"}.`,
      };
    }
    variants.push({ size, inventory });
  }
  return { data: variants };
}

export function productError(message: string): string {
  if (
    message.includes("products_slug_key") ||
    (message.includes("duplicate key") && message.includes("slug"))
  ) {
    return "A product with this slug already exists. Please choose a different slug.";
  }
  if (message.includes("duplicate key") && message.includes("product_variants")) {
    return "A variant with this size already exists.";
  }
  if (
    message.includes("invalid input syntax") ||
    message.includes("violates check constraint")
  ) {
    return "Invalid value. Please check price, inventory, or status.";
  }
  return message;
}
