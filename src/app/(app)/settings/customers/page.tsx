"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Table, type Column } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { AddCustomerDialog } from "@/components/settings/AddCustomerDialog";
import { Customer } from "@/domain/Customer";

const API_URL = "http://localhost:4000";

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
  const res = await fetch(`${API_URL}/api/customers`, { credentials: "include" });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.customers as ApiCustomer[]).map(toCustomer);
}

const columns: Column<Customer>[] = [
  { header: "Customer", cell: (c) => <span className="font-semibold">{c.name}</span> },
  { header: "Contact", cell: (c) => c.contact },
  { header: "Email", cell: (c) => c.email, className: "text-[var(--color-neutral-500)]" },
  { header: "City", cell: (c) => c.city, className: "text-[var(--color-neutral-500)]" },
];

export default function CustomersSettingsPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);

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

  return (
    <>
      <div className="flex justify-end mb-3">
        <Button variant="primary" onClick={() => setDialogOpen(true)}>
          Add customer
        </Button>
      </div>
      <Table
        columns={columns}
        rows={customers}
        rowKey={(c) => c.id}
        onRowClick={(c) => router.push(`/settings/customers/${c.id}`)}
      />

      {dialogOpen && <AddCustomerDialog onClose={() => setDialogOpen(false)} onSubmit={handleAddCustomer} />}
    </>
  );
}
