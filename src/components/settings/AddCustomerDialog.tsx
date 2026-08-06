import { useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { Field, Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface AddCustomerDialogProps {
  onClose: () => void;
  onSubmit: (data: { name: string; contact: string; email: string; city: string }) => void;
}

/** AddCustomerDialog — small controlled form; the store only learns about the new customer on submit (addCustomer), keeping in-progress typing local to this component. */
export function AddCustomerDialog({ onClose, onSubmit }: AddCustomerDialogProps) {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [email, setEmail] = useState("");

  const canSubmit = name.trim().length > 0;

  return (
    <Dialog
      title="Add customer"
      onClose={onClose}
      actions={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={!canSubmit}
            onClick={() => onSubmit({ name, contact, email, city: "" })}
          >
            Add customer
          </Button>
        </>
      }
    >
      <Field label="Company name">
        <Input placeholder="e.g. Cedar Ridge Café" value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <Field label="Contact person">
        <Input placeholder="e.g. Priya Nair" value={contact} onChange={(e) => setContact(e.target.value)} />
      </Field>
      <Field label="Email">
        <Input placeholder="name@company.com" value={email} onChange={(e) => setEmail(e.target.value)} />
      </Field>
    </Dialog>
  );
}
