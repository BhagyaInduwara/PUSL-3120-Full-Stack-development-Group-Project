"use client";

import { useEffect, useState } from "react";
import { Table, type Column } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { AddSupplierDialog, type AddSupplierData } from "@/components/settings/AddSupplierDialog";
import { Supplier } from "@/domain/Supplier";

const API_URL = "http://localhost:4000";

interface ApiSupplier {
  id: string;
  name: string;
  category: string;
  contact: string;
  leadTime: string;
}

function toSupplier(s: ApiSupplier): Supplier {
  return new Supplier({ id: s.id, name: s.name, category: s.category, contact: s.contact, leadTime: s.leadTime });
}

async function fetchSuppliers(): Promise<Supplier[]> {
  const res = await fetch(`${API_URL}/api/suppliers`, { credentials: "include" });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.suppliers as ApiSupplier[]).map(toSupplier);
}

const columns: Column<Supplier>[] = [
  { header: "Supplier", cell: (s) => <span className="font-semibold">{s.name}</span> },
  { header: "Category", cell: (s) => s.category, className: "text-[var(--color-neutral-500)]" },
  { header: "Contact", cell: (s) => s.contact },
  { header: "Lead time", cell: (s) => s.leadTime, className: "text-[var(--color-neutral-500)]" },
];

export default function SuppliersSettingsPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setSuppliers(await fetchSuppliers());
      } catch (error) {
        console.error("Error fetching suppliers:", error);
      }
    })();
  }, []);

  async function handleAddSupplier(data: AddSupplierData) {
    try {
      await fetch(`${API_URL}/api/suppliers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      setDialogOpen(false);
      setSuppliers(await fetchSuppliers());
    } catch (error) {
      console.error("Error adding supplier:", error);
    }
  }

  return (
    <>
      <div className="flex justify-end mb-3">
        <Button variant="primary" onClick={() => setDialogOpen(true)}>
          Add supplier
        </Button>
      </div>
      <Table columns={columns} rows={suppliers} rowKey={(s) => s.id} />

      {dialogOpen && <AddSupplierDialog onClose={() => setDialogOpen(false)} onSubmit={handleAddSupplier} />}
    </>
  );
}
