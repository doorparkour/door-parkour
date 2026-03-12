"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import type { Database } from "@/lib/supabase/types";

type ProductRow = Database["public"]["Tables"]["products"]["Row"];

interface ProductFormProps {
  action: (formData: FormData) => Promise<void>;
  defaultValues?: ProductRow;
}

export default function ProductForm({ action, defaultValues }: ProductFormProps) {
  const [error, formAction, pending] = useActionState(
    async (_: string | null, formData: FormData) => {
      try {
        await action(formData);
        return null;
      } catch (e) {
        return e instanceof Error ? e.message : "Something went wrong.";
      }
    },
    null
  );

  return (
    <form action={formAction} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Product Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              required
              defaultValue={defaultValues?.name ?? ""}
              placeholder="Door Parkour T-Shirt"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              rows={3}
              defaultValue={defaultValues?.description ?? ""}
              placeholder="Product description..."
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                name="slug"
                required
                defaultValue={defaultValues?.slug ?? ""}
                placeholder="door-parkour-tshirt"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="image_url">Image URL</Label>
              <Input
                id="image_url"
                name="image_url"
                type="url"
                defaultValue={defaultValues?.image_url ?? ""}
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="price">Price ($)</Label>
              <Input
                id="price"
                name="price"
                type="number"
                min={0}
                step="0.01"
                required
                defaultValue={
                  defaultValues ? (defaultValues.price_cents / 100).toFixed(2) : "0.00"
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inventory">Inventory</Label>
              <Input
                id="inventory"
                name="inventory"
                type="number"
                min={0}
                required
                defaultValue={defaultValues?.inventory ?? 0}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Checkbox
              id="is_active"
              name="is_active"
              defaultChecked={defaultValues?.is_active ?? true}
            />
            <Label htmlFor="is_active" className="font-normal cursor-pointer">
              Active (visible in store)
            </Label>
          </div>
        </CardContent>
      </Card>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-3">
        <Button
          type="submit"
          disabled={pending}
          className="bg-dp-orange text-white hover:bg-dp-orange-dark"
        >
          {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {defaultValues ? "Save Changes" : "Create Product"}
        </Button>
        <Button asChild variant="outline">
          <Link href="/admin/products">Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
