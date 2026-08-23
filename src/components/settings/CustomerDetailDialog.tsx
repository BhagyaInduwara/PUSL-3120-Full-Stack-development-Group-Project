"use client";

import { useState } from "react";
import type { Customer } from "@/domain/Customer";
import { RecordDialog, RecordRow } from "@/components/ui/RecordDialog";
import { Field, Input } from "@/components/ui/Input";

export interface CustomerEditableFields {
  name: string;
  contact: string;
  email: string;
  city: string;
}

interface CustomerDetailDialogProps {
  customer: Customer;
  onClose: () => void;
  onSave: (patch: CustomerEditableFields) => void;
}

/** CustomerDetailDialog — popup opened from the Customers table, same shell as Order/Invoice/Shipment detail dialogs. Customers have no status lifecycle, so they're always editable. */
export function CustomerDetailDialog({ customer, onClose, onSave }: CustomerDetailDialogProps) {
  const [name, setName] = useState(customer.name);
  const [contact, setContact] = useState(customer.contact);
  const [email, setEmail] = useState(customer.email);
  const [city, setCity] = useState(customer.city);

  const reset = () => {
    setName(customer.name);
    setContact(customer.contact);
    setEmail(customer.email);
    setCity(customer.city);
  };

  return (
    <RecordDialog
      title={customer.name}
      subtitle="Customer"
      editable
      onClose={onClose}
      onCancelEdit={reset}
      onSave={() => onSave({ name, contact, email, city })}
    >
      {(mode) =>
        mode === "view" ? (
          <>
            <RecordRow label="Company name" value={customer.name} />
            <RecordRow label="Contact person" value={customer.contact} />
            <RecordRow label="Email" value={customer.email} />
            <RecordRow label="City" value={customer.city} />
          </>
        ) : (
          <>
            <Field label="Company name">
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Field label="Contact person">
              <Input value={contact} onChange={(e) => setContact(e.target.value)} />
            </Field>
            <Field label="Email">
              <Input value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
            <Field label="City">
              <Input value={city} onChange={(e) => setCity(e.target.value)} />
            </Field>
          </>
        )
      }
    </RecordDialog>
  );
}
