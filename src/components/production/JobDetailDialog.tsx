"use client";

import { useState } from "react";
import type { ProductionJob, ProductionJobEditableFields } from "@/domain/ProductionJob";
import { RecordDialog, RecordRow } from "@/components/ui/RecordDialog";
import { Tag } from "@/components/ui/Tag";
import { Field, Input } from "@/components/ui/Input";

const STATUS_VARIANT = {
  Planned: "neutral",
  "In Progress": "accent",
  Completed: "neutral",
} as const;

interface JobDetailDialogProps {
  job: ProductionJob;
  onClose: () => void;
  onSave: (patch: Partial<ProductionJobEditableFields>) => void;
}

/** JobDetailDialog — popup opened from the Production Planning board.
 * - Planned jobs: full edit (product, customer, qty, due).
 * - In Progress jobs: edit mode for progress % only.
 * - Completed jobs: view only.
 */
export function JobDetailDialog({ job, onClose, onSave }: JobDetailDialogProps) {
  const [product, setProduct] = useState(job.product);
  const [customer, setCustomer] = useState(job.customer || "");
  const [qty, setQty] = useState(job.qty);
  const [due, setDue] = useState(job.due);
  const [progress, setProgress] = useState(job.progress);

  const reset = () => {
    setProduct(job.product);
    setCustomer(job.customer || "");
    setQty(job.qty);
    setDue(job.due);
    setProgress(job.progress);
  };

  // In Progress jobs can edit progress; Planned jobs can edit everything else
  const editable = job.canEdit || job.canEditProgress;

  return (
    <RecordDialog
      title={job.number}
      subtitle={`Production job · ${job.product}`}
      statusBadge={<Tag variant={STATUS_VARIANT[job.status]}>{job.status}</Tag>}
      editable={editable}
      onClose={onClose}
      onCancelEdit={reset}
      onSave={() => onSave({ product, qty, due, customer, progress })}
    >
      {(mode) =>
        mode === "view" ? (
          <>
            <RecordRow label="Product" value={job.product} />
            <RecordRow label="Linked Order" value={job.orderNumber || "General Stock (Unlinked)"} />
            {job.customer && <RecordRow label="Customer" value={job.customer} />}
            <RecordRow label="Quantity" value={job.qty} />
            <RecordRow label="Due" value={job.due} />
            {job.status === "In Progress" && (
              <RecordRow
                label="Progress"
                value={
                  <span className="flex items-center gap-2">
                    <span className="text-[var(--color-accent)] font-semibold">{job.progress}%</span>
                    <div className="w-24 h-1.5 rounded-full bg-[var(--color-neutral-800)] overflow-hidden">
                      <div
                        className="h-full bg-[var(--color-accent)] transition-all"
                        style={{ width: `${job.progress}%` }}
                      />
                    </div>
                  </span>
                }
              />
            )}
          </>
        ) : (
          <>
            {job.canEdit && (
              <>
                <Field label="Product">
                  <Input value={product} onChange={(e) => setProduct(e.target.value)} />
                </Field>
                <Field label="Customer / Destination">
                  <Input value={customer} onChange={(e) => setCustomer(e.target.value)} />
                </Field>
                <Field label="Quantity">
                  <Input type="number" value={qty} onChange={(e) => setQty(Number(e.target.value) || 0)} />
                </Field>
                <Field label="Due">
                  <Input value={due} onChange={(e) => setDue(e.target.value)} />
                </Field>
              </>
            )}
            {job.canEditProgress && (
              <Field label={`Completion — ${progress}%`}>
                <div className="flex flex-col gap-2">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={progress}
                    onChange={(e) => setProgress(Number(e.target.value))}
                    className="w-full accent-[var(--color-accent)] cursor-pointer"
                  />
                  <div className="w-full h-2 rounded-full bg-[var(--color-neutral-800)] overflow-hidden">
                    <div
                      className="h-full bg-[var(--color-accent)] transition-all duration-200"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </Field>
            )}
          </>
        )
      }
    </RecordDialog>
  );
}
