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

async function fetchOrderOptions(): Promise<ApiOrderOption[]> {
  const res = await fetch(`${API_URL}/api/orders`, { credentials: "include" });
  if (!res.ok) return [];
  return (await res.json()) as ApiOrderOption[];
}

export interface NewInvoiceData {
  orderId: string;
  issueDate: string;
  dueDate: string;
}

interface NewInvoiceDialogProps {
  onClose: () => void;
  onSubmit: (data: NewInvoiceData) => void;
  error?: string | null;
}

/** NewInvoiceDialog — bills an existing Order; the order list is fetched live so the picker always reflects real orders. */
export function NewInvoiceDialog({ onClose, onSubmit, error }: NewInvoiceDialogProps) {
  const [orders, setOrders] = useState<ApiOrderOption[]>([]);
  const [orderId, setOrderId] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [dueDate, setDueDate] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const fetched = await fetchOrderOptions();
        setOrders(fetched);
        if (fetched.length > 0) setOrderId(fetched[0]._id);
      } catch (err) {
        console.error("Error fetching orders:", err);
      }
    })();
  }, []);

  const canSubmit = orderId.length > 0;

  return (
    <Dialog
      title="New Invoice"
      onClose={onClose}
      actions={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={!canSubmit}
            onClick={() => onSubmit({ orderId, issueDate, dueDate })}
          >
            Create invoice
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
      <Field label="Issue date">
        <Input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
      </Field>
      <Field label="Due date">
        <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
      </Field>

      {error && (
        <div className="text-[13px] text-[var(--color-accent-300)] bg-[var(--color-accent-900)] border border-[var(--color-accent-700)] rounded-[var(--radius-md)] px-3 py-2">
          {error}
        </div>
      )}
    </Dialog>
  );
}
