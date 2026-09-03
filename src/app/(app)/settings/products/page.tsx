"use client";

import { useEffect, useState } from "react";
import { Table, type Column } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { AddProductDialog, type AddProductData } from "@/components/settings/AddProductDialog";
import { ProductDetailDialog, type ProductEditableFields } from "@/components/settings/ProductDetailDialog";
import { Product } from "@/domain/Product";

import { API_URL } from "@/lib/apiUrl";
import { fetchWithCache } from "@/lib/offline";

interface ApiProduct {
  id: string;
  sku: string;
  name: string;
  category: string;
  price: number;
}

function toProduct(p: ApiProduct): Product {
  return new Product({ sku: p.sku, name: p.name, category: p.category, price: p.price });
}

interface FetchedProducts {
  products: Product[];
  mongoIdBySku: Record<string, string>;
}

async function fetchProducts(): Promise<FetchedProducts> {
  try {
    const { data } = await fetchWithCache<{ products: ApiProduct[] }>(`${API_URL}/api/products`);
    const apiProducts = data.products ?? [];
    return {
      products: apiProducts.map(toProduct),
      mongoIdBySku: Object.fromEntries(apiProducts.map((p) => [p.sku, p.id])),
    };
  } catch (error) {
    console.warn("Failed to fetch products:", error);
    return { products: [], mongoIdBySku: {} };
  }
}

const columns: Column<Product>[] = [
  { header: "SKU", cell: (p) => p.sku, className: "text-[var(--color-neutral-500)]" },
  { header: "Name", cell: (p) => <span className="font-semibold">{p.name}</span> },
  { header: "Category", cell: (p) => p.category, className: "text-[var(--color-neutral-500)]" },
  { header: "Unit price", cell: (p) => p.priceFormatted },
];

export default function ProductsSettingsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  // Product uses its sku as domain id, but PUT requests need the real Mongo
  // _id — kept separately rather than smuggled into the domain class, which
  // has no field for it (same pattern as inventory/page.tsx).
  const [mongoIdBySku, setMongoIdBySku] = useState<Record<string, string>>({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const fetched = await fetchProducts();
        setProducts(fetched.products);
        setMongoIdBySku(fetched.mongoIdBySku);
      } catch (err) {
        console.error("Error fetching products:", err);
      }
    })();
  }, []);

  async function handleAddProduct(data: AddProductData) {
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Couldn't add the product.");
        return;
      }
      setDialogOpen(false);
      const fetched = await fetchProducts();
      setProducts(fetched.products);
      setMongoIdBySku(fetched.mongoIdBySku);
    } catch (err) {
      console.error("Error adding product:", err);
      setError("Couldn't reach the server. Please try again.");
    }
  }

  async function handleSaveProduct(patch: ProductEditableFields) {
    if (!selectedProduct) return;
    const mongoId = mongoIdBySku[selectedProduct.sku];
    if (!mongoId) return;
    try {
      await fetch(`${API_URL}/api/products/${mongoId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(patch),
      });
      setSelectedProduct(null);
      const fetched = await fetchProducts();
      setProducts(fetched.products);
      setMongoIdBySku(fetched.mongoIdBySku);
    } catch (error) {
      console.error("Error saving product:", error);
    }
  }

  return (
    <>
      <div className="flex justify-end mb-3">
        <Button variant="primary" onClick={() => setDialogOpen(true)}>
          Add product
        </Button>
      </div>
      <Table columns={columns} rows={products} rowKey={(p) => p.sku} onRowClick={setSelectedProduct} />

      {dialogOpen && (
        <AddProductDialog
          error={error}
          onClose={() => {
            setDialogOpen(false);
            setError(null);
          }}
          onSubmit={handleAddProduct}
        />
      )}

      {selectedProduct && (
        <ProductDetailDialog
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onSave={handleSaveProduct}
        />
      )}
    </>
  );
}
