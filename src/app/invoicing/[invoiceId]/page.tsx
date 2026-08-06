"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import { useERPStore } from "@/store/useERPStore";
import { PageHeader } from "@/components/layout/PageHeader";
import { LinkButton } from "@/components/ui/Button";
import { InvoiceDetail } from "@/components/invoicing/InvoiceDetail";

export default function InvoiceDetailPage({ params }: { params: Promise<{ invoiceId: string }> }) {
  const { invoiceId } = use(params);
  const store = useERPStore();
  const invoice = store.findInvoice(invoiceId);

  if (!invoice) notFound();

  return (
    <>
      <PageHeader
        title="Invoicing"
        subtitle="Track billing status across every order."
        actions={
          <LinkButton href="/invoicing" variant="ghost">
            &larr; Back to invoices
          </LinkButton>
        }
      />
      <div className="flex-1 overflow-auto px-8 pt-6 pb-10">
        <InvoiceDetail invoice={invoice} order={store.invoiceOrder(invoice)} onMarkPaid={() => store.markInvoicePaid(invoice.id)} />
      </div>
    </>
  );
}
