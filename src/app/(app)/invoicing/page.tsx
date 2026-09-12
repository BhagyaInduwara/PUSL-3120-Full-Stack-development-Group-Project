"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { InvoiceTable } from "@/components/invoicing/InvoiceTable";
import { InvoiceDetailDialog } from "@/components/invoicing/InvoiceDetailDialog";
import { NewInvoiceDialog, type NewInvoiceData } from "@/components/invoicing/NewInvoiceDialog";
import { Invoice, type InvoiceEditableFields, type InvoiceStatus } from "@/domain/Invoice";
import { Order, type OrderStatus, type OrderLineItem } from "@/domain/Order";

import { API_URL } from "@/lib/apiUrl";
import { fetchWithCache } from "@/lib/offline";
import { useLiveEvent } from "@/hooks/useLiveEvent";

function fmtDate(value: string): string {
  if (!value) return value;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

interface ApiOrderEmbed {
  id: string;
  number: string;
  customer: string;
  lineItems: OrderLineItem[];
  status: OrderStatus;
  date: string;
  updatedAt: string;
}

interface ApiInvoice {
  id: string;
  number: string;
  orderId: string;
  order?: ApiOrderEmbed;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  updatedAt: string;
}

function toOrder(o: ApiOrderEmbed): Order {
  return new Order({
    id: o.id,
    number: o.number,
    customer: o.customer,
    lineItems: o.lineItems,
    status: o.status,
    date: fmtDate(o.date),
    updatedAt: o.updatedAt,
  });
}

function toInvoice(i: ApiInvoice): Invoice {
  return new Invoice({
    id: i.id,
    number: i.number,
    orderId: i.orderId,
    status: i.status,
    issueDate: fmtDate(i.issueDate),
    dueDate: fmtDate(i.dueDate),
    updatedAt: i.updatedAt,
  });
}

/** Fetches invoices from the API; falls back to the cached snapshot (src/lib/offline) if the request fails. */
async function fetchInvoices(): Promise<{ invoices: Invoice[]; orderById: Map<string, Order> }> {
  try {
    const { data } = await fetchWithCache<{ invoices: ApiInvoice[] }>(`${API_URL}/api/invoices`);
    const apiInvoices = data.invoices;
    const orderById = new Map<string, Order>();

    for (const i of apiInvoices) {
      if (i.order) orderById.set(i.orderId, toOrder(i.order));
    }

    return { invoices: apiInvoices.map(toInvoice), orderById };
  } catch (error) {
    console.error("Error fetching invoices (no cache available either):", error);
    return { invoices: [], orderById: new Map() };
  }
}

export default function InvoicingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [orderById, setOrderById] = useState<Map<string, Order>>(new Map());
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [newInvoiceOpen, setNewInvoiceOpen] = useState(false);
  const [newInvoiceError, setNewInvoiceError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { invoices, orderById } = await fetchInvoices();
      setInvoices(invoices);
      setOrderById(orderById);
    })();
  }, []);

  async function refreshInvoices() {
    const { invoices, orderById } = await fetchInvoices();
    setInvoices(invoices);
    setOrderById(orderById);
  }

  /**
   * Keeps the table in sync when another client creates, updates, or marks
   * an invoice paid — invoice.controller.ts emits "invoice:changed" over
   * the shared Socket.io connection whenever any of those happen
   * server-side. Same "just refetch" approach as sales/page.tsx's
   * "order:changed" listener.
   */
  useLiveEvent("invoice:changed", () => {
    refreshInvoices();
  });

  async function handleSave(patch: Partial<InvoiceEditableFields>) {
    if (!selectedInvoice) return;
    try {
      // expectedUpdatedAt is the value this dialog was opened with — the
      // backend (invoice.controller.ts's updateInvoice) rejects the write
      // with 409 if someone else saved a change to this invoice since,
      // rather than silently overwriting it. See sales/page.tsx's
      // handleSaveOrder for the same pattern with a user-facing message.
      const res = await fetch(`${API_URL}/api/invoices/${selectedInvoice.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ...patch, expectedUpdatedAt: selectedInvoice.updatedAt }),
      });
      if (res.status === 409) {
        console.error("Conflicting edit: this invoice was changed by someone else since it was opened.");
      }
      setSelectedInvoice(null);
      const { invoices, orderById } = await fetchInvoices();
      setInvoices(invoices);
      setOrderById(orderById);
    } catch (error) {
      console.error("Error updating invoice:", error);
    }
  }

  async function handleCreateInvoice(data: NewInvoiceData) {
    setNewInvoiceError(null);
    try {
      const res = await fetch(`${API_URL}/api/invoices`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      const body = await res.json();
      if (!res.ok) {
        setNewInvoiceError(body.error ?? "Couldn't create the invoice.");
        return;
      }
      setNewInvoiceOpen(false);
      const { invoices, orderById } = await fetchInvoices();
      setInvoices(invoices);
      setOrderById(orderById);
    } catch (error) {
      console.error("Error creating invoice:", error);
      setNewInvoiceError("Couldn't reach the server. Please try again.");
    }
  }

  async function handleMarkPaid() {
    if (!selectedInvoice) return;
    try {
      await fetch(`${API_URL}/api/invoices/${selectedInvoice.id}/mark-paid`, {
        method: "PATCH",
        credentials: "include",
      });
      setSelectedInvoice(null);
      const { invoices, orderById } = await fetchInvoices();
      setInvoices(invoices);
      setOrderById(orderById);
    } catch (error) {
      console.error("Error marking invoice paid:", error);
    }
  }

  return (
    <>
      <PageHeader
        title="Invoicing"
        subtitle="Track billing status across every order."
        actions={
          <Button variant="primary" onClick={() => setNewInvoiceOpen(true)}>
            New Invoice
          </Button>
        }
      />
      <div className="flex-1 overflow-auto px-8 pt-6 pb-10">
        <InvoiceTable invoices={invoices} orderById={orderById} onSelect={setSelectedInvoice} />
      </div>

      {selectedInvoice && (
        <InvoiceDetailDialog
          invoice={selectedInvoice}
          order={orderById.get(selectedInvoice.orderId)}
          onClose={() => setSelectedInvoice(null)}
          onSave={handleSave}
          onMarkPaid={handleMarkPaid}
        />
      )}

      {newInvoiceOpen && (
        <NewInvoiceDialog
          error={newInvoiceError}
          onClose={() => {
            setNewInvoiceOpen(false);
            setNewInvoiceError(null);
          }}
          onSubmit={handleCreateInvoice}
        />
      )}
    </>
  );
}