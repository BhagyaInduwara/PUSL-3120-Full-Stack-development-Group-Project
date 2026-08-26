"use client";

import { useEffect, useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { API_URL } from "@/lib/apiUrl";

interface ApiOrderOption {
  _id: string;
  number: string;
  customer: string;
}

interface ApiInvoiceOption {
  id: string;
  number: string;
}

async function fetchOrderOptions(): Promise<ApiOrderOption[]> {
  const res = await fetch(`${API_URL}/api/orders`, { credentials: "include" });
  if (!res.ok) return [];
  return (await res.json()) as ApiOrderOption[];
}

async function fetchInvoiceOptions(): Promise<ApiInvoiceOption[]> {
  const res = await fetch(`${API_URL}/api/invoices`, { credentials: "include" });
  if (!res.ok) return [];
  const data = await res.json();
  return data.invoices as ApiInvoiceOption[];
}

export interface NewShipmentData {
  orderId: string;
  invoiceId: string | null;
  date: string;
}

interface NewShipmentDialogProps {
  onClose: () => void;
  onSubmit: (data: NewShipmentData) => void;
  error?: string | null;
}

/** NewShipmentDialog — ships an existing Order, optionally linked to one of its Invoices; both lists are fetched live. */
export function NewShipmentDialog({ onClose, onSubmit, error }: NewShipmentDialogProps) {
  const [orders, setOrders] = useState<ApiOrderOption[]>([]);
  const [invoices, setInvoices] = useState<ApiInvoiceOption[]>([]);
  const [orderId, setOrderId] = useState("");
  const [invoiceId, setInvoiceId] = useState("");
  const [date, setDate] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [fetchedOrders, fetchedInvoices] = await Promise.all([fetchOrderOptions(), fetchInvoiceOptions()]);
        setOrders(fetchedOrders);
        setInvoices(fetchedInvoices);
        if (fetchedOrders.length > 0) setOrderId(fetchedOrders[0]._id);
      } catch (err) {
        console.error("Error fetching orders/invoices:", err);
      }
    })();
  }, []);

  const canSubmit = orderId.length > 0;

  return (
    <Dialog
      title="New Shipment"
      onClose={onClose}
      actions={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={!canSubmit}
            onClick={() => onSubmit({ orderId, invoiceId: invoiceId || null, date })}
          >
            Create shipment
          </Button>
        </>
      }
    >
      <Field label="Order">
        <Select value={orderId} onChange={(e) => setOrderId(e.target.value)}>
          {orders.length === 0 && <option value="">No orders available</option>}
          {orders.map((o) => (
            <option key={o._id} value={o._id}>
              {o.number} — {o.customer}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Invoice (optional)">
        <Select value={invoiceId} onChange={(e) => setInvoiceId(e.target.value)}>
          <option value="">None</option>
          {invoices.map((i) => (
            <option key={i.id} value={i.id}>
              {i.number}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Ship date">
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </Field>

      {error && (
        <div className="text-[13px] text-[var(--color-accent-300)] bg-[var(--color-accent-900)] border border-[var(--color-accent-700)] rounded-[var(--radius-md)] px-3 py-2">
          {error}
        </div>
      )}
    </Dialog>
  );
}
