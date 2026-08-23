"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { InvoiceTable } from "@/components/invoicing/InvoiceTable";
import { InvoiceDetailDialog } from "@/components/invoicing/InvoiceDetailDialog";
import { Invoice, type InvoiceEditableFields, type InvoiceStatus } from "@/domain/Invoice";
import { Order, type OrderStatus, type OrderLineItem } from "@/domain/Order";

const API_URL = "http://localhost:4000";

function fmtDate(value: string): string {
  if (!value) return value;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

interface ApiOrderEmbed {
  id: string;
  customer: string;
  lineItems: OrderLineItem[];
  status: OrderStatus;
  date: string;
}

interface ApiInvoice {
  id: string;
  orderId: string;
  order?: ApiOrderEmbed;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
}

function toOrder(o: ApiOrderEmbed): Order {
  return new Order({
    id: o.id,
    customer: o.customer,
    lineItems: o.lineItems,
    status: o.status,
    date: fmtDate(o.date),
  });
}

function toInvoice(i: ApiInvoice): Invoice {
  return new Invoice({
    id: i.id,
    orderId: i.orderId,
    status: i.status,
    issueDate: fmtDate(i.issueDate),
    dueDate: fmtDate(i.dueDate),
  });
}

async function fetchInvoices(): Promise<{ invoices: Invoice[]; orderById: Map<string, Order> }> {
  const res = await fetch(`${API_URL}/api/invoices`, { credentials: "include" });
  if (!res.ok) return { invoices: [], orderById: new Map() };
  const data = await res.json();
  const apiInvoices = data.invoices as ApiInvoice[];
  const orderById = new Map<string, Order>();
  for (const i of apiInvoices) {
    if (i.order) orderById.set(i.orderId, toOrder(i.order));
  }
  return { invoices: apiInvoices.map(toInvoice), orderById };
}

export default function InvoicingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [orderById, setOrderById] = useState<Map<string, Order>>(new Map());
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { invoices, orderById } = await fetchInvoices();
        setInvoices(invoices);
        setOrderById(orderById);
      } catch (error) {
        console.error("Error fetching invoices:", error);
      }
    })();
  }, []);

  async function handleSave(patch: Partial<InvoiceEditableFields>) {
    if (!selectedInvoice) return;
    try {
      await fetch(`${API_URL}/api/invoices/${selectedInvoice.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(patch),
      });
      setSelectedInvoice(null);
      const { invoices, orderById } = await fetchInvoices();
      setInvoices(invoices);
      setOrderById(orderById);
    } catch (error) {
      console.error("Error updating invoice:", error);
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
        actions={<Button variant="primary">New Invoice</Button>}
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
    </>
  );
}
