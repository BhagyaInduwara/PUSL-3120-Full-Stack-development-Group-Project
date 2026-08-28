"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { API_URL } from "@/lib/apiUrl";

interface ApiProduct {
  name: string;
}

interface ApiOrder {
  _id: string;
  number: string;
  customer: string;
  lineItems: { product: string; qty: number; price: number }[];
  status: string;
}

async function fetchProductNames(): Promise<string[]> {
  const res = await fetch(`${API_URL}/api/products`, { credentials: "include" });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.products as ApiProduct[]).map((p) => p.name);
}

async function fetchOrders(): Promise<ApiOrder[]> {
  const res = await fetch(`${API_URL}/api/orders`, { credentials: "include" });
  if (!res.ok) return [];
  return (await res.json()) as ApiOrder[];
}

interface NewJobModalProps {
  onClose: () => void;
  onSubmit: (data: { product: string; qty: number; due: string; orderNumber?: string; customer?: string }) => void;
}

/** NewJobModal — allows scheduling jobs linked to a specific Sales Order or for General Stock replenishment. */
export function NewJobModal({ onClose, onSubmit }: NewJobModalProps) {
  const [products, setProducts] = useState<string[]>([]);
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [selectedOrderNumber, setSelectedOrderNumber] = useState<string>("");
  const [customer, setCustomer] = useState<string>("Internal Stock");
  const [product, setProduct] = useState("");
  const [qty, setQty] = useState(1);
  const [due, setDue] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [names, ords] = await Promise.all([fetchProductNames(), fetchOrders()]);
        setProducts(names);
        setOrders(ords);
        setProduct((prev) => prev || names[0] || "");
      } catch (error) {
        console.error("Error fetching data for job creation:", error);
      }
    })();
  }, []);

  function handleOrderChange(ordNum: string) {
    setSelectedOrderNumber(ordNum);
    if (!ordNum) {
      setCustomer("Internal Stock");
      return;
    }
    const found = orders.find((o) => o.number === ordNum);
    if (found) {
      setCustomer(found.customer);
      if (found.lineItems && found.lineItems.length > 0) {
        setProduct(found.lineItems[0].product);
        setQty(found.lineItems[0].qty);
      }
    }
  }

  const canSubmit = product.length > 0 && qty > 0 && due.length > 0;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit({
      product,
      qty,
      due,
      orderNumber: selectedOrderNumber || undefined,
      customer: customer || undefined,
    });
  }

  return (
    <Dialog
      title="New Production Job"
      onClose={onClose}
      actions={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={!canSubmit}>
            Schedule Job
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <Field label="Link to Sales Order (Optional)">
          <Select value={selectedOrderNumber} onChange={(e) => handleOrderChange(e.target.value)}>
            <option value="">General Stock (Unlinked)</option>
            {orders.map((o) => (
              <option key={o._id} value={o.number}>
                {o.number} — {o.customer} ({o.status})
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Product">
          <Select value={product} onChange={(e) => setProduct(e.target.value)}>
            {products.length === 0 && <option value="">No products available</option>}
            {products.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Customer / Destination">
          <Input
            value={customer}
            onChange={(e) => setCustomer(e.target.value)}
            placeholder="e.g. Foothill Realty Partners or Internal Stock"
          />
        </Field>

        <Field label="Batch quantity">
          <Input
            type="number"
            min={1}
            value={qty}
            onChange={(e) => setQty(Number(e.target.value) || 0)}
            placeholder="Enter batch quantity"
          />
        </Field>

        <Field label="Due date">
          <Input type="date" value={due} onChange={(e) => setDue(e.target.value)} />
        </Field>
      </form>
    </Dialog>
  );
}
