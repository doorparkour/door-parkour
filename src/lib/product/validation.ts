export type ProductInput = {
  name: string;
  description: string | null;
  price_cents: number;
  inventory: number;
  slug: string;
  image_url: string | null;
  status: "active" | "draft" | "archived";
  on_demand: boolean;
  size: string | null;
};

export function parseProductInput(formData: FormData): { data?: ProductInput; error?: string } {
  const priceCents = Math.round(parseFloat((formData.get("price") as string) || "0") * 100);
  if (Number.isNaN(priceCents) || priceCents < 0) {
    return { error: "Please enter a valid price." };
  }

  const inventoryRaw = formData.get("inventory") as string;
  const onDemand = formData.get("on_demand") === "on";
  const inventory = inventoryRaw ? parseInt(inventoryRaw) : 0;
  if (!onDemand && (Number.isNaN(inventory) || inventory < 0)) {
    return { error: "Please enter a valid inventory (0 or greater)." };
  }

  const slug = (formData.get("slug") as string)?.trim();
  if (!slug) {
    return { error: "Slug is required." };
  }

  const status = ((formData.get("status") as string) || "active") as "active" | "draft" | "archived";

  return {
    data: {
      name: formData.get("name") as string,
      description: (formData.get("description") as string) || null,
      price_cents: priceCents,
      inventory,
      slug,
      image_url: (formData.get("image_url") as string) || null,
      status,
      on_demand: onDemand,
      size: (formData.get("size") as string) || null,
    },
  };
}

export function productError(message: string): string {
  if (
    message.includes("products_slug_key") ||
    (message.includes("duplicate key") && message.includes("slug"))
  ) {
    return "A product with this slug already exists. Please choose a different slug.";
  }
  if (message.includes("duplicate key") && message.includes("name")) {
    return "A product with this name and size already exists.";
  }
  if (
    message.includes("invalid input syntax") ||
    message.includes("violates check constraint")
  ) {
    return "Invalid value. Please check price, inventory, or status.";
  }
  return message;
}
