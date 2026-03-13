"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/dashboard");

  return supabase;
}

// ── Classes ──────────────────────────────────────────────────

export async function createClass(formData: FormData) {
  const supabase = await requireAdmin();

  const startsAt = new Date(formData.get("starts_at") as string);
  if (startsAt <= new Date()) throw new Error("Class must be scheduled in the future.");

  const { error } = await supabase.from("classes").insert({
    title: formData.get("title") as string,
    description: (formData.get("description") as string) || null,
    image_url: (formData.get("image_url") as string) || null,
    location: formData.get("location") as string,
    starts_at: formData.get("starts_at") as string,
    duration_mins: parseInt(formData.get("duration_mins") as string),
    capacity: parseInt(formData.get("capacity") as string),
    spots_remaining: parseInt(formData.get("capacity") as string),
    price_cents: Math.round(parseFloat(formData.get("price") as string) * 100),
    is_published: formData.get("is_published") === "on",
    age_group: formData.get("age_group") as string,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/admin/classes");
  revalidatePath("/classes");
  redirect("/admin/classes");
}

export async function deleteClass(id: string) {
  const supabase = await requireAdmin();

  const { error } = await supabase.from("classes").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/classes");
  revalidatePath("/classes");
}

export async function updateClass(id: string, formData: FormData) {
  const supabase = await requireAdmin();

  const { error } = await supabase
    .from("classes")
    .update({
      title: formData.get("title") as string,
      description: (formData.get("description") as string) || null,
      image_url: (formData.get("image_url") as string) || null,
      location: formData.get("location") as string,
      starts_at: formData.get("starts_at") as string,
      duration_mins: parseInt(formData.get("duration_mins") as string),
      capacity: parseInt(formData.get("capacity") as string),
      price_cents: Math.round(parseFloat(formData.get("price") as string) * 100),
      is_published: formData.get("is_published") === "on",
      age_group: formData.get("age_group") as string,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/admin/classes");
  revalidatePath("/classes");
  redirect("/admin/classes");
}

// ── Products ──────────────────────────────────────────────────

export async function createProduct(formData: FormData) {
  const supabase = await requireAdmin();

  const inventoryRaw = formData.get("inventory") as string;
  const onDemand = formData.get("on_demand") === "on";
  const { error } = await supabase.from("products").insert({
    name: formData.get("name") as string,
    description: (formData.get("description") as string) || null,
    price_cents: Math.round(parseFloat(formData.get("price") as string) * 100),
    inventory: inventoryRaw ? parseInt(inventoryRaw) : 0,
    slug: formData.get("slug") as string,
    image_url: (formData.get("image_url") as string) || null,
    is_active: formData.get("is_active") === "on",
    on_demand: onDemand,
    size: (formData.get("size") as string) || null,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/admin/products");
  revalidatePath("/merch");
  redirect("/admin/products");
}

export async function deleteProduct(id: string) {
  const supabase = await requireAdmin();

  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/products");
  revalidatePath("/merch");
}

export async function updateProduct(id: string, formData: FormData) {
  const supabase = await requireAdmin();

  const inventoryRaw = formData.get("inventory") as string;
  const onDemand = formData.get("on_demand") === "on";
  const { error } = await supabase
    .from("products")
    .update({
      name: formData.get("name") as string,
      description: (formData.get("description") as string) || null,
      price_cents: Math.round(parseFloat(formData.get("price") as string) * 100),
      inventory: inventoryRaw ? parseInt(inventoryRaw) : 0,
      slug: formData.get("slug") as string,
      image_url: (formData.get("image_url") as string) || null,
      is_active: formData.get("is_active") === "on",
      on_demand: onDemand,
      size: (formData.get("size") as string) || null,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/admin/products");
  revalidatePath("/merch");
  redirect("/admin/products");
}
