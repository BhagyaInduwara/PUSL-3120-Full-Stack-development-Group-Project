"use client";

import { useERPStore } from "@/store/useERPStore";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { InvoiceTable } from "@/components/invoicing/InvoiceTable";

export default function InvoicingPage() {
  const store = useERPStore();

  return (
    <>
      <PageHeader
        title="Invoicing"
        subtitle="Track billing status across every order."
        actions={<Button variant="primary">New Invoice</Button>}
      />
      <div className="flex-1 overflow-auto px-8 pt-6 pb-10">
        <InvoiceTable invoices={store.invoices} />
      </div>
    </>
  );
}
