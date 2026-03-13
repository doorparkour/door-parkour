import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil } from "lucide-react";
import DeleteButton from "@/components/admin/DeleteButton";
import { deleteProduct } from "@/lib/actions/admin";

export const metadata: Metadata = { title: "Admin — Products" };

export default async function AdminProductsPage() {
  const supabase = await createClient();
  const { data: products } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dp-teal">Products</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage merch products, including inactive ones.
          </p>
        </div>
        <Button asChild className="bg-dp-orange text-white hover:bg-dp-orange-dark">
          <Link href="/admin/products/new">
            <Plus className="mr-2 h-4 w-4" />
            New Product
          </Link>
        </Button>
      </div>

      <div className="rounded-lg border bg-white overflow-hidden">
        {!products?.length ? (
          <p className="p-6 text-sm text-muted-foreground">No products yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Slug</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Price</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Inventory</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-medium">{product.name}</td>
                  <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{product.slug}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    ${(product.price_cents / 100).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{product.inventory}</td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={product.status === "active" ? "default" : "secondary"}
                      className={product.status === "archived" ? "bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-100" : ""}
                    >
                      {product.status.charAt(0).toUpperCase() + product.status.slice(1)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/admin/products/${product.id}/edit`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      <DeleteButton
                        label={product.name}
                        action={deleteProduct.bind(null, product.id)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
