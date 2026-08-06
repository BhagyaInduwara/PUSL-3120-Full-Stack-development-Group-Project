"use client";

import { useRouter } from "next/navigation";
import type { Invoice } from "@/domain/Invoice";
import { useERPStore } from "@/store/useERPStore";
import { Table, type Column } from "@/components/ui/Table";
import { StatusTag } from "@/components/ui/Tag";

/** InvoiceTable — list view; each row navigates to /invoicing/[id] (the master-detail split from the original design, expressed as real routes). */
export function InvoiceTable({ invoices }: { invoices: Invoice[] }) {
  const store = useERPStore();
  const router = useRouter();

  const columns: Column<Invoice>[] = [
    { header: "Invoice", cell: (inv) => <span className="font-semibold">{inv.id}</span> },
    { header: "Customer", cell: (inv) => store.invoiceCustomer(inv) },
    { header: "Linked order", cell: (inv) => inv.orderId, className: "text-[var(--color-neutral-500)]" },
    { header: "Amount", cell: (inv) => store.invoiceAmountFormatted(inv) },
    { header: "Due", cell: (inv) => inv.dueDate, className: "text-[var(--color-neutral-500)]" },
    { header: "Status", cell: (inv) => <StatusTag entity={inv} /> },
  ];

  return (
    <Table columns={columns} rows={invoices} rowKey={(inv) => inv.id} onRowClick={(inv) => router.push(`/invoicing/${inv.id}`)} />
  );
}
