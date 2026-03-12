import type { Metadata } from "next";
import { createProduct } from "@/lib/actions/admin";
import ProductForm from "@/components/admin/ProductForm";

export const metadata: Metadata = { title: "Admin — New Product" };

export default function NewProductPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-dp-teal">New Product</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Add a new merch product. Set it as inactive until ready to sell.
        </p>
      </div>
      <ProductForm action={createProduct} />
    </div>
  );
}
