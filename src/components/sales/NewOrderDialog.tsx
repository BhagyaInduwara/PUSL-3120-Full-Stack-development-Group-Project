"use client";

import { useEffect, useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import type { OrderLineItem } from "@/domain/Order";
import { API_URL } from "@/lib/apiUrl";

interface ApiProduct {
  name: string;
  price: number;
}

async function fetchProducts(): Promise<ApiProduct[]> {
  const res = await fetch(`${API_URL}/api/products`, { credentials: "include" });
  if (!res.ok) return [];
  const data = await res.json();
  return data.products as ApiProduct[];
}

export interface NewOrderData {
  customer: string;
  lineItems: OrderLineItem[];
}

interface NewOrderDialogProps {
  onClose: () => void;
  onSubmit: (data: NewOrderData) => void;
  error?: string | null;
}

const emptyLine = (products: ApiProduct[]): OrderLineItem => ({
  product: products[0]?.name ?? "",
  qty: 1,
  price: products[0]?.price ?? 0,
});

/** NewOrderDialog — manually create an Order from scratch (customer + line items), separate from the incoming-email-draft review flow in NewOrderDrawer. Products come from the real catalog so a line item's product always matches a real Product name. */
export function NewOrderDialog({ onClose, onSubmit, error }: NewOrderDialogProps) {
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [customer, setCustomer] = useState("");
  const [lineItems, setLineItems] = useState<OrderLineItem[]>([{ product: "", qty: 1, price: 0 }]);

  useEffect(() => {
    (async () => {
      try {
        const fetched = await fetchProducts();
        setProducts(fetched);
        if (fetched.length > 0) {
          setLineItems([emptyLine(fetched)]);
        }
      } catch (err) {
        console.error("Error fetching products:", err);
      }
    })();
  }, []);

  function updateLine(index: number, patch: Partial<OrderLineItem>) {
    setLineItems((prev) => prev.map((li, i) => (i === index ? { ...li, ...patch } : li)));
  }

  function handleProductChange(index: number, name: string) {
    const product = products.find((p) => p.name === name);
    updateLine(index, { product: name, price: product?.price ?? 0 });
  }

  function addLine() {
    setLineItems((prev) => [...prev, emptyLine(products)]);
  }

  function removeLine(index: number) {
    setLineItems((prev) => prev.filter((_, i) => i !== index));
  }

  const canSubmit =
    customer.trim().length > 0 &&
    lineItems.length > 0 &&
    lineItems.every((li) => li.product.length > 0 && li.qty > 0);

  return (
    <Dialog
      title="New Order"
      onClose={onClose}
      actions={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" disabled={!canSubmit} onClick={() => onSubmit({ customer, lineItems })}>
            Create order
          </Button>
        </>
      }
    >
      <Field label="Customer">
        <Input
          placeholder="e.g. Bluepeak Coworking"
          value={customer}
          onChange={(e) => setCustomer(e.target.value)}
        />
      </Field>

      <div>
        <label className="block text-xs mb-1.5 text-[color-mix(in_srgb,var(--color-text)_70%,transparent)]">
          Line items
        </label>
        <div className="flex flex-col gap-2">
          {lineItems.map((li, i) => (
            <div
              key={i}
              className="grid grid-cols-[1fr_56px_76px_24px] gap-2 items-center p-2.5 rounded-lg bg-[var(--color-surface)] border border-[var(--color-divider)]"
            >
              <Select value={li.product} onChange={(e) => handleProductChange(i, e.target.value)}>
                <option value="">Select product</option>
                {products.map((p) => (
                  <option key={p.name} value={p.name}>
                    {p.name}
                  </option>
                ))}
              </Select>
              <Input
                type="number"
                min={1}
                className="text-center px-1.5 py-1"
                value={li.qty}
                onChange={(e) => updateLine(i, { qty: Number(e.target.value) || 0 })}
              />
              <Input
                type="number"
                className="text-right px-1.5 py-1"
                value={li.price}
                onChange={(e) => updateLine(i, { price: Number(e.target.value) || 0 })}
              />
              <button
                type="button"
                onClick={() => removeLine(i)}
                disabled={lineItems.length === 1}
                aria-label="Remove line item"
                className="text-[var(--color-neutral-500)] hover:text-[var(--color-accent)] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <Button variant="ghost" className="mt-2 px-0" onClick={addLine}>
          + Add line item
        </Button>
      </div>

      {error && (
        <div className="text-[13px] text-[var(--color-accent-300)] bg-[var(--color-accent-900)] border border-[var(--color-accent-700)] rounded-[var(--radius-md)] px-3 py-2">
          {error}
        </div>
      )}
    </Dialog>
  );
}
