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

  const { error } = await supabase.from("classes").insert({
    title: formData.get("title") as string,
    description: (formData.get("description") as string) || null,
    location: formData.get("location") as string,
    starts_at: formData.get("starts_at") as string,
    duration_mins: parseInt(formData.get("duration_mins") as string),
    capacity: parseInt(formData.get("capacity") as string),
    spots_remaining: parseInt(formData.get("capacity") as string),
    price_cents: Math.round(parseFloat(formData.get("price") as string) * 100),
    is_published: formData.get("is_published") === "on",
  });

  if (error) throw new Error(error.message);

  revalidatePath("/admin/classes");
  revalidatePath("/classes");
  redirect("/admin/classes");
}

export async function updateClass(id: string, formData: FormData) {
  const supabase = await requireAdmin();

  const { error } = await supabase
    .from("classes")
    .update({
      title: formData.get("title") as string,
      description: (formData.get("description") as string) || null,
      location: formData.get("location") as string,
      starts_at: formData.get("starts_at") as string,
      duration_mins: parseInt(formData.get("duration_mins") as string),
      capacity: parseInt(formData.get("capacity") as string),
      price_cents: Math.round(parseFloat(formData.get("price") as string) * 100),
      is_published: formData.get("is_published") === "on",
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

  const { error } = await supabase.from("products").insert({
    name: formData.get("name") as string,
    description: (formData.get("description") as string) || null,
    price_cents: Math.round(parseFloat(formData.get("price") as string) * 100),
    inventory: parseInt(formData.get("inventory") as string),
    slug: formData.get("slug") as string,
    image_url: (formData.get("image_url") as string) || null,
    is_active: formData.get("is_active") === "on",
  });

  if (error) throw new Error(error.message);

  revalidatePath("/admin/products");
  revalidatePath("/merch");
  redirect("/admin/products");
}

export async function updateProduct(id: string, formData: FormData) {
  const supabase = await requireAdmin();

  const { error } = await supabase
    .from("products")
    .update({
      name: formData.get("name") as string,
      description: (formData.get("description") as string) || null,
      price_cents: Math.round(parseFloat(formData.get("price") as string) * 100),
      inventory: parseInt(formData.get("inventory") as string),
      slug: formData.get("slug") as string,
      image_url: (formData.get("image_url") as string) || null,
      is_active: formData.get("is_active") === "on",
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/admin/products");
  revalidatePath("/merch");
  redirect("/admin/products");
}
