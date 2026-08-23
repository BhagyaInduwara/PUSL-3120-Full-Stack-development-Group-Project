import { useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { Field, Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export interface AddProductData {
  sku: string;
  name: string;
  category: string;
  price: number;
}

interface AddProductDialogProps {
  onClose: () => void;
  onSubmit: (data: AddProductData) => void;
  error?: string | null;
}

/** AddProductDialog — mirrors AddCustomerDialog's shape; the parent page owns persisting the submitted data. */
export function AddProductDialog({ onClose, onSubmit, error }: AddProductDialogProps) {
  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");

  const priceNumber = Number(price);
  const canSubmit = sku.trim().length > 0 && name.trim().length > 0 && Number.isFinite(priceNumber) && priceNumber >= 0;

  return (
    <Dialog
      title="Add product"
      onClose={onClose}
      actions={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={!canSubmit}
            onClick={() => onSubmit({ sku, name, category, price: priceNumber })}
          >
            Add product
          </Button>
        </>
      }
    >
      <Field label="SKU">
        <Input placeholder="e.g. DSK-EXW" value={sku} onChange={(e) => setSku(e.target.value)} />
      </Field>
      <Field label="Name">
        <Input placeholder="e.g. Executive Desk – Walnut" value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <Field label="Category">
        <Input placeholder="e.g. Desks" value={category} onChange={(e) => setCategory(e.target.value)} />
      </Field>
      <Field label="Unit price">
        <Input type="number" min={0} placeholder="0.00" value={price} onChange={(e) => setPrice(e.target.value)} />
      </Field>
      {error && (
        <div className="text-[13px] text-[var(--color-accent-300)] bg-[var(--color-accent-900)] border border-[var(--color-accent-700)] rounded-[var(--radius-md)] px-3 py-2">
          {error}
        </div>
      )}
    </Dialog>
  );
}
