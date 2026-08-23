"use client";

import { useState } from "react";
import type { Supplier } from "@/domain/Supplier";
import { RecordDialog, RecordRow } from "@/components/ui/RecordDialog";
import { Field, Input } from "@/components/ui/Input";

export interface SupplierEditableFields {
  name: string;
  category: string;
  contact: string;
  leadTime: string;
}

interface SupplierDetailDialogProps {
  supplier: Supplier;
  onClose: () => void;
  onSave: (patch: SupplierEditableFields) => void;
}

/** SupplierDetailDialog — popup opened from the Suppliers table, same shell as Order/Invoice/Shipment detail dialogs. Suppliers have no status lifecycle, so they're always editable. */
export function SupplierDetailDialog({ supplier, onClose, onSave }: SupplierDetailDialogProps) {
  const [name, setName] = useState(supplier.name);
  const [category, setCategory] = useState(supplier.category);
  const [contact, setContact] = useState(supplier.contact);
  const [leadTime, setLeadTime] = useState(supplier.leadTime);

  const reset = () => {
    setName(supplier.name);
    setCategory(supplier.category);
    setContact(supplier.contact);
    setLeadTime(supplier.leadTime);
  };

  return (
    <RecordDialog
      title={supplier.name}
      subtitle="Supplier"
      editable
      onClose={onClose}
      onCancelEdit={reset}
      onSave={() => onSave({ name, category, contact, leadTime })}
    >
      {(mode) =>
        mode === "view" ? (
          <>
            <RecordRow label="Name" value={supplier.name} />
            <RecordRow label="Category" value={supplier.category} />
            <RecordRow label="Contact" value={supplier.contact} />
            <RecordRow label="Lead time" value={supplier.leadTime} />
          </>
        ) : (
          <>
            <Field label="Name">
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Field label="Category">
              <Input value={category} onChange={(e) => setCategory(e.target.value)} />
            </Field>
            <Field label="Contact">
              <Input value={contact} onChange={(e) => setContact(e.target.value)} />
            </Field>
            <Field label="Lead time">
              <Input value={leadTime} onChange={(e) => setLeadTime(e.target.value)} />
            </Field>
          </>
        )
      }
    </RecordDialog>
  );
}
