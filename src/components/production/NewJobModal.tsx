"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";

const PRODUCTS = [
  "ErgoDesk Pro",
  "FlexiChair",
  "Executive Table",
  "Oak Storage Unit",
  "Acoustic Divider",
];

const SUPERVISORS = [
  "Sarah Jenkins",
  "Marcus Vance",
  "Elena Rostova",
  "David Kim",
];

const PRIORITIES = ["Normal", "High", "Rush"] as const;
type Priority = (typeof PRIORITIES)[number];

interface NewJobModalProps {
  onClose: () => void;
  onSubmit?: (data: {
    product: string;
    qty: number;
    due: string;
    priority: Priority;
    supervisor: string;
  }) => void;
}

export function NewJobModal({ onClose, onSubmit }: NewJobModalProps) {
  const [product, setProduct] = useState(PRODUCTS[0]);
  const [qty, setQty] = useState(50);
  const [due, setDue] = useState("");
  const [priority, setPriority] = useState<Priority>("Normal");
  const [supervisor, setSupervisor] = useState(SUPERVISORS[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit({ product, qty, due, priority, supervisor });
    }
    onClose();
  };

  const selectStyle =
    "w-full min-h-9 px-2.5 py-1.5 text-sm text-[var(--color-text)] bg-[var(--color-surface)] " +
    "border border-[var(--color-divider)] rounded-[var(--radius-md)] outline-none " +
    "hover:border-[color-mix(in_srgb,var(--color-text)_45%,transparent)] " +
    "focus-visible:border-[var(--color-accent)] cursor-pointer";

  return (
    <Dialog
      title="New Production Job"
      onClose={onClose}
      actions={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit}>
            Schedule Job
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <Field label="Product Selection">
          <select
            value={product}
            onChange={(e) => setProduct(e.target.value)}
            className={selectStyle}
          >
            {PRODUCTS.map((item) => (
              <option key={item} value={item} className="bg-[var(--color-surface)] text-[var(--color-text)]">
                {item}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Batch Quantity">
          <Input
            type="number"
            min={1}
            value={qty}
            onChange={(e) => setQty(Number(e.target.value) || 0)}
            placeholder="Enter batch quantity"
          />
        </Field>

        <Field label="Due Date">
          <Input
            type="date"
            value={due}
            onChange={(e) => setDue(e.target.value)}
          />
        </Field>

        <Field label="Priority Level">
          <div className="flex gap-2 pt-0.5">
            {PRIORITIES.map((p) => {
              const isActive = priority === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`flex-1 py-1.5 px-3 rounded-[var(--radius-md)] text-xs font-medium border transition-colors cursor-pointer ${
                    isActive
                      ? p === "Rush"
                        ? "bg-[color-mix(in_srgb,var(--color-accent)_20%,transparent)] border-[var(--color-accent)] text-[var(--color-accent)]"
                        : p === "High"
                        ? "bg-[color-mix(in_srgb,var(--color-warning,orange)_20%,transparent)] border-[color-mix(in_srgb,var(--color-warning,orange)_80%,transparent)] text-[var(--color-text)]"
                        : "bg-[color-mix(in_srgb,var(--color-text)_15%,transparent)] border-[var(--color-text)] text-[var(--color-text)]"
                      : "border-[var(--color-divider)] text-[color-mix(in_srgb,var(--color-text)_60%,transparent)] hover:border-[color-mix(in_srgb,var(--color-text)_35%,transparent)]"
                  }`}
                >
                  {p}
                </button>
              );
            })}
          </div>
        </Field>

        <Field label="Assigned Supervisor">
          <select
            value={supervisor}
            onChange={(e) => setSupervisor(e.target.value)}
            className={selectStyle}
          >
            {SUPERVISORS.map((sup) => (
              <option key={sup} value={sup} className="bg-[var(--color-surface)] text-[var(--color-text)]">
                {sup}
              </option>
            ))}
          </select>
        </Field>
      </form>
    </Dialog>
  );
}
