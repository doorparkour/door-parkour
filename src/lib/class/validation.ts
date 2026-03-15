export type ClassInput = {
  title: string;
  description: string | null;
  image_url: string | null;
  location: string;
  starts_at: string;
  duration_mins: number;
  capacity: number;
  spots_remaining: number;
  price_cents: number;
  is_published: boolean;
  age_group: string;
};

export function parseClassInput(
  formData: FormData,
  opts?: { requireFutureDate?: boolean }
): { data?: ClassInput; error?: string } {
  const requireFuture = opts?.requireFutureDate ?? false;

  const startsAtRaw = formData.get("starts_at") as string;
  const startsAt = new Date(startsAtRaw);
  if (Number.isNaN(startsAt.getTime())) {
    return { error: "Invalid date format. Use the date picker." };
  }
  if (requireFuture && startsAt <= new Date()) {
    return { error: "Class must be scheduled in the future." };
  }

  const priceRaw = formData.get("price") as string;
  const priceCents = Math.round(parseFloat(priceRaw || "0") * 100);
  if (Number.isNaN(priceCents) || priceCents < 0) {
    return { error: "Invalid price." };
  }

  const ageGroup = (formData.get("age_group") as string) || "adult";
  if (!["youth", "adult"].includes(ageGroup)) {
    return { error: "Invalid age group." };
  }

  const durationMins = parseInt(formData.get("duration_mins") as string);
  const capacity = parseInt(formData.get("capacity") as string);

  return {
    data: {
      title: formData.get("title") as string,
      description: (formData.get("description") as string) || null,
      image_url: (formData.get("image_url") as string) || null,
      location: formData.get("location") as string,
      starts_at: startsAtRaw,
      duration_mins: durationMins,
      capacity,
      spots_remaining: capacity,
      price_cents: priceCents,
      is_published: formData.get("is_published") === "on",
      age_group: ageGroup,
    },
  };
}
