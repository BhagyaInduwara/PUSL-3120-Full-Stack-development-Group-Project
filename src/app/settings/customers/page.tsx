"use client";

import { useState } from "react";
import { useERPStore } from "@/store/useERPStore";
import { Table, type Column } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { AddCustomerDialog } from "@/components/settings/AddCustomerDialog";
import type { Customer } from "@/domain/Customer";

const columns: Column<Customer>[] = [
  { header: "Customer", cell: (c) => <span className="font-semibold">{c.name}</span> },
  { header: "Contact", cell: (c) => c.contact },
  { header: "Email", cell: (c) => c.email, className: "text-[var(--color-neutral-500)]" },
  { header: "City", cell: (c) => c.city, className: "text-[var(--color-neutral-500)]" },
];

export default function CustomersSettingsPage() {
  const store = useERPStore();
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <div className="flex justify-end mb-3">
        <Button variant="primary" onClick={() => setDialogOpen(true)}>
          Add customer
        </Button>
      </div>
      <Table columns={columns} rows={store.customers} rowKey={(c) => c.id} />

      {dialogOpen && (
        <AddCustomerDialog
          onClose={() => setDialogOpen(false)}
          onSubmit={(data) => {
            store.addCustomer(data);
            setDialogOpen(false);
          }}
        />
      )}
    </>
  );
}
