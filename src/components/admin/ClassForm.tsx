"use client";

import { isRedirectError } from "@/lib/navigation";
import { useActionState, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import type { Database } from "@/lib/supabase/types";

const AGE_GROUPS = [
  { value: "youth", label: "Youth (Ages 8–13)" },
  { value: "adult", label: "Adult (Ages 14+)" },
] as const;

type ClassRow = Database["public"]["Tables"]["classes"]["Row"];

interface ClassFormProps {
  action: (formData: FormData) => Promise<{ error?: string } | void>;
  defaultValues?: ClassRow;
}

function toDatetimeLocal(iso: string) {
  return new Date(iso).toISOString().slice(0, 16);
}

function nowDatetimeLocal() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}

export default function ClassForm({ action, defaultValues }: ClassFormProps) {
  const [priceValue, setPriceValue] = useState(
    defaultValues ? (defaultValues.price_cents / 100).toFixed(2) : ""
  );
  const [ageGroup, setAgeGroup] = useState(
    defaultValues?.age_group ?? "adult"
  );

  function handlePriceChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/[^\d.]/g, "");
    const parts = raw.split(".");
    setPriceValue(parts.length > 2 ? parts[0] + "." + parts.slice(1).join("") : raw);
  }

  function handlePriceBlur() {
    const num = parseFloat(priceValue);
    if (!isNaN(num)) setPriceValue(num.toFixed(2));
  }

  const [error, formAction, pending] = useActionState(
    async (_: string | null, formData: FormData) => {
      formData.set("price", priceValue || "0");
      formData.set("age_group", ageGroup);
      // datetime-local sends local time without timezone; server (UTC) misinterprets it.
      // Convert to ISO UTC so server parses correctly.
      const startsAtLocal = formData.get("starts_at") as string;
      if (startsAtLocal) {
        const d = new Date(startsAtLocal);
        if (!Number.isNaN(d.getTime())) {
          formData.set("starts_at", d.toISOString());
        }
      }
      try {
        const result = await action(formData);
        if (result && typeof result === "object" && "error" in result && result.error) {
          return result.error;
        }
        return null;
      } catch (e) {
        if (isRedirectError(e)) throw e;
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
            <Label>Age Group</Label>
            <Select value={ageGroup} onValueChange={setAgeGroup}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AGE_GROUPS.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="image_url">
              Image URL{" "}
              <span className="text-xs font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="image_url"
              name="image_url"
              type="url"
              defaultValue={defaultValues?.image_url ?? ""}
              placeholder="https://..."
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
                min={!defaultValues ? nowDatetimeLocal() : undefined}
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
              <Label htmlFor="price">Price</Label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">
                  $
                </span>
                <Input
                  id="price"
                  name="price"
                  className="pl-6"
                  inputMode="decimal"
                  value={priceValue}
                  onChange={handlePriceChange}
                  onBlur={handlePriceBlur}
                  placeholder="0.00"
                  required
                />
              </div>
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
