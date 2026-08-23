"use client";

import type { Invoice } from "@/domain/Invoice";
import type { Order } from "@/domain/Order";
import { Money } from "@/domain/Money";
import { Table, type Column } from "@/components/ui/Table";
import { StatusTag } from "@/components/ui/Tag";

interface InvoiceTableProps {
  invoices: Invoice[];
  /** Keyed by Invoice.orderId — the page fetches this from the real API's populated order, not ERPStore. */
  orderById: Map<string, Order>;
  onSelect: (invoice: Invoice) => void;
}

/** InvoiceTable — list view; each row opens the InvoiceDetailDialog popup (see app/invoicing/page.tsx). */
export function InvoiceTable({ invoices, orderById, onSelect }: InvoiceTableProps) {
  const columns: Column<Invoice>[] = [
    { header: "Invoice", cell: (inv) => <span className="font-semibold">{inv.number}</span> },
    { header: "Customer", cell: (inv) => orderById.get(inv.orderId)?.customer ?? "—" },
    { header: "Linked order", cell: (inv) => orderById.get(inv.orderId)?.number ?? inv.orderId, className: "text-[var(--color-neutral-500)]" },
    { header: "Amount", cell: (inv) => (orderById.get(inv.orderId)?.amount ?? Money.zero()).format() },
    { header: "Due", cell: (inv) => inv.dueDate, className: "text-[var(--color-neutral-500)]" },
    { header: "Status", cell: (inv) => <StatusTag entity={inv} /> },
  ];

  return <Table columns={columns} rows={invoices} rowKey={(inv) => inv.id} onRowClick={onSelect} />;
}
