"use client";

import { useState } from "react";
import { useERPStore } from "@/store/useERPStore";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { InvoiceTable } from "@/components/invoicing/InvoiceTable";
import { InvoiceDetailDialog } from "@/components/invoicing/InvoiceDetailDialog";
import type { Invoice } from "@/domain/Invoice";

export default function InvoicingPage() {
  const store = useERPStore();
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  return (
    <>
      <PageHeader
        title="Invoicing"
        subtitle="Track billing status across every order."
        actions={<Button variant="primary">New Invoice</Button>}
      />
      <div className="flex-1 overflow-auto px-8 pt-6 pb-10">
        <InvoiceTable invoices={store.invoices} onSelect={setSelectedInvoice} />
      </div>

      {selectedInvoice && (
        <InvoiceDetailDialog
          invoice={selectedInvoice}
          order={store.invoiceOrder(selectedInvoice)}
          onClose={() => setSelectedInvoice(null)}
          onSave={(patch) => store.updateInvoice(selectedInvoice.id, patch)}
          onMarkPaid={() => store.markInvoicePaid(selectedInvoice.id)}
        />
      )}
    </>
  );
}
