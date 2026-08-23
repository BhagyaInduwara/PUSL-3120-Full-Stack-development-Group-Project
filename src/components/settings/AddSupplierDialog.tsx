import { useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { Field, Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export interface AddSupplierData {
  name: string;
  category: string;
  contact: string;
  leadTime: string;
}

interface AddSupplierDialogProps {
  onClose: () => void;
  onSubmit: (data: AddSupplierData) => void;
}

/** AddSupplierDialog — mirrors AddCustomerDialog's shape; the parent page owns persisting the submitted data. */
export function AddSupplierDialog({ onClose, onSubmit }: AddSupplierDialogProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [contact, setContact] = useState("");
  const [leadTime, setLeadTime] = useState("");

  const canSubmit = name.trim().length > 0;

  return (
    <Dialog
      title="Add supplier"
      onClose={onClose}
      actions={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" disabled={!canSubmit} onClick={() => onSubmit({ name, category, contact, leadTime })}>
            Add supplier
          </Button>
        </>
      }
    >
      <Field label="Supplier name">
        <Input placeholder="e.g. Cascade Hardwoods Ltd" value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <Field label="Category">
        <Input placeholder="e.g. Lumber" value={category} onChange={(e) => setCategory(e.target.value)} />
      </Field>
      <Field label="Contact person">
        <Input placeholder="e.g. Marcus Voss" value={contact} onChange={(e) => setContact(e.target.value)} />
      </Field>
      <Field label="Lead time">
        <Input placeholder="e.g. 2 weeks" value={leadTime} onChange={(e) => setLeadTime(e.target.value)} />
      </Field>
    </Dialog>
  );
}
