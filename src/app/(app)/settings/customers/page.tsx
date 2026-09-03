"use client";

import { useEffect, useState } from "react";
import { Table, type Column } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { AddCustomerDialog } from "@/components/settings/AddCustomerDialog";
import { CustomerDetailDialog, type CustomerEditableFields } from "@/components/settings/CustomerDetailDialog";
import { Customer } from "@/domain/Customer";

import { API_URL } from "@/lib/apiUrl";
import { fetchWithCache } from "@/lib/offline";

interface ApiCustomer {
  id: string;
  name: string;
  contact: string;
  email: string;
  city: string;
}

function toCustomer(c: ApiCustomer): Customer {
  return new Customer({ id: c.id, name: c.name, contact: c.contact, email: c.email, city: c.city });
}

async function fetchCustomers(): Promise<Customer[]> {
  try {
    const { data } = await fetchWithCache<{ customers: ApiCustomer[] }>(`${API_URL}/api/customers`);
    return (data.customers ?? []).map(toCustomer);
  } catch (error) {
    console.warn("Failed to fetch customers:", error);
    return [];
  }
}

const columns: Column<Customer>[] = [
  { header: "Customer", cell: (c) => <span className="font-semibold">{c.name}</span> },
  { header: "Contact", cell: (c) => c.contact },
  { header: "Email", cell: (c) => c.email, className: "text-[var(--color-neutral-500)]" },
  { header: "City", cell: (c) => c.city, className: "text-[var(--color-neutral-500)]" },
];

export default function CustomersSettingsPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setCustomers(await fetchCustomers());
      } catch (error) {
        console.error("Error fetching customers:", error);
      }
    })();
  }, []);

  async function handleAddCustomer(data: { name: string; contact: string; email: string; city: string }) {
    try {
      await fetch(`${API_URL}/api/customers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      setDialogOpen(false);
      setCustomers(await fetchCustomers());
    } catch (error) {
      console.error("Error adding customer:", error);
    }
  }

  async function handleSaveCustomer(patch: CustomerEditableFields) {
    if (!selectedCustomer) return;
    try {
      await fetch(`${API_URL}/api/customers/${selectedCustomer.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(patch),
      });
      setSelectedCustomer(null);
      setCustomers(await fetchCustomers());
    } catch (error) {
      console.error("Error saving customer:", error);
    }
  }

  return (
    <>
      <div className="flex justify-end mb-3">
        <Button variant="primary" onClick={() => setDialogOpen(true)}>
          Add customer
        </Button>
      </div>
      <Table columns={columns} rows={customers} rowKey={(c) => c.id} onRowClick={setSelectedCustomer} />

      {dialogOpen && <AddCustomerDialog onClose={() => setDialogOpen(false)} onSubmit={handleAddCustomer} />}

      {selectedCustomer && (
        <CustomerDetailDialog
          customer={selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
          onSave={handleSaveCustomer}
        />
      )}
    </>
  );
}
