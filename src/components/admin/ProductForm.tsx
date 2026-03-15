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
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import type { ProductWithVariants } from "@/lib/merch";

const APPAREL_SIZES = ["XS", "S", "M", "L", "XL", "XXL"] as const;

const MERCH_PRESETS = {
  apparel: {
    label: "Apparel",
    hasSize: true,
    names: [
      "Door Parkour T-Shirt",
      "Door Parkour Long-Sleeve Shirt",
      "Door Parkour Pullover Hoodie",
      "Door Parkour Zipped Hoodie",
    ],
  },
  accessories: {
    label: "Accessories",
    names: [
      "Door Parkour String Bag",
      "Door Parkour Water Bottle",
    ],
  },
} as const;

const allNames = Object.values(MERCH_PRESETS).flatMap((p) => p.names);
const multipleTypes = Object.keys(MERCH_PRESETS).length > 1;
const apparelNames = new Set<string>(MERCH_PRESETS.apparel.names);

function defaultName() {
  return Object.values(MERCH_PRESETS)[0].names[0];
}

function toSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function getVariantInventory(
  variants: { size: string | null; inventory: number }[] | undefined,
  size: string | null
) {
  const v = variants?.find((x) => x.size === size);
  return v?.inventory ?? 0;
}

type DefaultValues = ProductWithVariants | null;

interface ProductFormProps {
  action: (formData: FormData) => Promise<{ error?: string } | void>;
  defaultValues?: DefaultValues;
}

export default function ProductForm({ action, defaultValues }: ProductFormProps) {
  const initialName = defaultValues?.name ?? defaultName();
  const initialIsApparel = apparelNames.has(initialName);

  const [selectedName, setSelectedName] = useState<string>(initialName);
  const [slug, setSlug] = useState(
    defaultValues?.slug ?? toSlug(initialName)
  );
  const [priceValue, setPriceValue] = useState(
    defaultValues ? (defaultValues.price_cents / 100).toFixed(2) : ""
  );
  const [isOnDemand, setIsOnDemand] = useState(
    defaultValues?.on_demand ?? false
  );
  const [isLive, setIsLive] = useState(defaultValues?.status !== "draft");
  const [inventoryBySize, setInventoryBySize] = useState<Record<string, number>>(
    () => {
      const out: Record<string, number> = {};
      for (const s of APPAREL_SIZES) {
        out[s] = getVariantInventory(defaultValues?.product_variants, s);
      }
      out[""] = getVariantInventory(defaultValues?.product_variants, null);
      return out;
    }
  );

  const isApparel = apparelNames.has(selectedName);

  function handleNameChange(name: string) {
    setSelectedName(name);
    setSlug(toSlug(name));
  }

  function handlePriceChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/[^\d.]/g, "");
    const parts = raw.split(".");
    setPriceValue(
      parts.length > 2 ? parts[0] + "." + parts.slice(1).join("") : raw
    );
  }

  function handlePriceBlur() {
    const num = parseFloat(priceValue);
    if (!isNaN(num)) setPriceValue(num.toFixed(2));
  }

  function setInventory(size: string, value: number) {
    setInventoryBySize((prev) => ({ ...prev, [size]: value }));
  }

  function handleInventoryChange(
    size: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const raw = e.target.value.replace(/\D/g, "");
    const val = raw === "" ? 0 : Math.max(0, parseInt(raw, 10));
    setInventory(size, Number.isNaN(val) ? 0 : val);
  }

  const [error, formAction, pending] = useActionState(
    async (_: string | null, formData: FormData) => {
      formData.set("name", selectedName);
      formData.set("price", priceValue || "0");
      formData.set("slug", slug);
      formData.set("status", isLive ? "active" : "draft");
      if (isApparel) {
        for (const s of APPAREL_SIZES) {
          formData.set(`inventory_${s}`, String(inventoryBySize[s] ?? 0));
        }
      } else {
        formData.set("inventory", String(inventoryBySize[""] ?? 0));
      }
      try {
        const result = await action(formData);
        if (
          result &&
          typeof result === "object" &&
          "error" in result &&
          result.error
        ) {
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
          <CardTitle className="text-base">Product Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Select value={selectedName} onValueChange={handleNameChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {multipleTypes
                  ? Object.values(MERCH_PRESETS).map((preset) => (
                      <SelectGroup key={preset.label}>
                        <SelectLabel>{preset.label}</SelectLabel>
                        {preset.names.map((name) => (
                          <SelectItem key={name} value={name}>
                            {name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    ))
                  : allNames.map((name) => (
                      <SelectItem key={name} value={name}>
                        {name}
                      </SelectItem>
                    ))}
              </SelectContent>
            </Select>
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
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="door-parkour-t-shirt"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="image_url">
                Image URL{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  (optional)
                </span>
              </Label>
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
              <Label htmlFor="price">Price</Label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">
                  $
                </span>
                <Input
                  id="price"
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

            {!isOnDemand && (
              <div className="space-y-2">
                <Label>
                  {isApparel ? "Inventory per size" : "Inventory"}
                </Label>
                {isApparel ? (
                  <div className="flex flex-wrap gap-2">
                    {APPAREL_SIZES.map((s) => (
                      <div key={s} className="flex w-14 flex-col gap-1">
                        <Label
                          htmlFor={`inventory_${s}`}
                          className="text-xs text-muted-foreground"
                        >
                          {s}
                        </Label>
                        <Input
                          id={`inventory_${s}`}
                          name={`inventory_${s}`}
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={inventoryBySize[s] ?? 0}
                          onChange={(e) => handleInventoryChange(s, e)}
                          className="h-8 w-full"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <Input
                    id="inventory"
                    name="inventory"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={inventoryBySize[""] ?? 0}
                    onChange={(e) => handleInventoryChange("", e)}
                    placeholder="0"
                  />
                )}
              </div>
            )}
          </div>

          <div className="space-y-4 pt-1">
            <div className="flex items-center gap-2">
              <Checkbox
                id="on_demand"
                name="on_demand"
                checked={isOnDemand}
                onCheckedChange={(v) => setIsOnDemand(!!v)}
              />
              <Label htmlFor="on_demand" className="font-normal cursor-pointer">
                On-demand{" "}
                <span className="text-xs text-muted-foreground">
                  (no inventory tracking, always orderable)
                </span>
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="is_live"
                checked={isLive}
                onCheckedChange={(v) => setIsLive(!!v)}
              />
              <Label htmlFor="is_live" className="font-normal cursor-pointer">
                Published (visible to users)
              </Label>
            </div>
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
