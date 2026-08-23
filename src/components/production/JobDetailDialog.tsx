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

/** JobDetailDialog — popup opened from the Production Planning board. Editable only while the job is still Planned (ProductionJob.canEdit — its stand-in for "Draft", since jobs have no Draft status). */
export function JobDetailDialog({ job, onClose, onSave }: JobDetailDialogProps) {
  const [product, setProduct] = useState(job.product);
  const [qty, setQty] = useState(job.qty);
  const [due, setDue] = useState(job.due);

  const reset = () => {
    setProduct(job.product);
    setQty(job.qty);
    setDue(job.due);
  };

  return (
    <RecordDialog
      title={job.number}
      subtitle={`Production job · ${job.product}`}
      statusBadge={<Tag variant={STATUS_VARIANT[job.status]}>{job.status}</Tag>}
      editable={job.canEdit}
      onClose={onClose}
      onCancelEdit={reset}
      onSave={() => onSave({ product, qty, due })}
    >
      {(mode) =>
        mode === "view" ? (
          <>
            <RecordRow label="Product" value={job.product} />
            <RecordRow label="Quantity" value={job.qty} />
            <RecordRow label="Due" value={job.due} />
            {job.status === "In Progress" && <RecordRow label="Progress" value={`${job.progress}%`} />}
          </>
        ) : (
          <>
            <Field label="Product">
              <Input value={product} onChange={(e) => setProduct(e.target.value)} />
            </Field>
            <Field label="Quantity">
              <Input type="number" value={qty} onChange={(e) => setQty(Number(e.target.value) || 0)} />
            </Field>
            <Field label="Due">
              <Input value={due} onChange={(e) => setDue(e.target.value)} />
            </Field>
          </>
        )
      }
    </RecordDialog>
  );
}
