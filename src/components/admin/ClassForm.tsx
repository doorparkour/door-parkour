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

type ClassRow = Database["public"]["Tables"]["classes"]["Row"];

interface ClassFormProps {
  action: (formData: FormData) => Promise<void>;
  defaultValues?: ClassRow;
}

function toDatetimeLocal(iso: string) {
  return new Date(iso).toISOString().slice(0, 16);
}

export default function ClassForm({ action, defaultValues }: ClassFormProps) {
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
          <CardTitle className="text-base">Class Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              name="title"
              required
              defaultValue={defaultValues?.title ?? ""}
              placeholder="Intro to Parkour"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              rows={3}
              defaultValue={defaultValues?.description ?? ""}
              placeholder="What will participants learn?"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                name="location"
                required
                defaultValue={defaultValues?.location ?? ""}
                placeholder="Sunset Park, Sturgeon Bay"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="starts_at">Date &amp; Time</Label>
              <Input
                id="starts_at"
                name="starts_at"
                type="datetime-local"
                required
                defaultValue={
                  defaultValues?.starts_at
                    ? toDatetimeLocal(defaultValues.starts_at)
                    : ""
                }
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="duration_mins">Duration (mins)</Label>
              <Input
                id="duration_mins"
                name="duration_mins"
                type="number"
                min={15}
                required
                defaultValue={defaultValues?.duration_mins ?? 60}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="capacity">Capacity</Label>
              <Input
                id="capacity"
                name="capacity"
                type="number"
                min={1}
                required
                defaultValue={defaultValues?.capacity ?? 10}
              />
            </div>
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
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Checkbox
              id="is_published"
              name="is_published"
              defaultChecked={defaultValues?.is_published ?? false}
            />
            <Label htmlFor="is_published" className="font-normal cursor-pointer">
              Published (visible to users)
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
          {defaultValues ? "Save Changes" : "Create Class"}
        </Button>
        <Button asChild variant="outline">
          <Link href="/admin/classes">Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
