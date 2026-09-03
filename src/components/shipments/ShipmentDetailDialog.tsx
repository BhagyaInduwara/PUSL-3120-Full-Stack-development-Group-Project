"use client";

import { useState } from "react";
import type { Shipment, ShipmentEditableFields, ShipmentStatus } from "@/domain/Shipment";
import { RecordDialog, RecordRow } from "@/components/ui/RecordDialog";
import { StatusTag } from "@/components/ui/Tag";
import { Field, Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";

interface ShipmentDetailDialogProps {
  shipment: Shipment;
  customer: string;
  orderNumber: string;
  onClose: () => void;
  onSave: (patch: Partial<ShipmentEditableFields>) => void;
  onDispatch?: (id: string) => void;
  onDeliver?: (id: string) => void;
}

const ALL_STATUSES: ShipmentStatus[] = ["Draft", "Packed", "Dispatched", "Delivered"];

/** ShipmentDetailDialog — popup opened from the Shipments table with full delivery lifecycle controls. */
export function ShipmentDetailDialog({
  shipment,
  customer,
  orderNumber,
  onClose,
  onSave,
  onDispatch,
  onDeliver,
}: ShipmentDetailDialogProps) {
  const [date, setDate] = useState(shipment.date);
  const [status, setStatus] = useState<ShipmentStatus>(shipment.status);

  const reset = () => {
    setDate(shipment.date);
    setStatus(shipment.status);
  };

  return (
    <RecordDialog
      title={shipment.number}
      subtitle={`Shipment · ${customer}`}
      statusBadge={<StatusTag entity={shipment} />}
      editable={shipment.canEdit}
      onClose={onClose}
      onCancelEdit={reset}
      onSave={() => onSave({ date, status })}
    >
      {(mode) =>
        mode === "view" ? (
          <>
            <RecordRow label="Customer" value={customer} />
            <RecordRow label="Order" value={orderNumber} />
            <RecordRow label="Invoice" value={shipment.invoiceLabel} />
            <RecordRow label="Ship date" value={shipment.date} />
            <RecordRow label="Status" value={<StatusTag entity={shipment} />} />

            {/* Quick lifecycle action bar */}
            <div className="mt-3 pt-3 border-t border-[color-mix(in_srgb,var(--color-text)_8%,transparent)] flex flex-wrap items-center gap-2">
              <span className="text-xs text-[var(--color-neutral-500)] font-medium">Quick Actions:</span>
              {shipment.status === "Draft" && (
                <Button
                  variant="secondary"
                  className="text-xs py-1 px-2.5 h-auto"
                  onClick={() => onSave({ status: "Packed" })}
                >
                  Mark as Packed
                </Button>
              )}
              {(shipment.status === "Draft" || shipment.status === "Packed") && onDispatch && (
                <Button
                  variant="secondary"
                  className="text-xs py-1 px-2.5 h-auto"
                  onClick={() => onDispatch(shipment.id)}
                >
                  Dispatch Shipment
                </Button>
              )}
              {shipment.status === "Dispatched" && onDeliver && (
                <Button
                  variant="primary"
                  className="text-xs py-1 px-2.5 h-auto"
                  onClick={() => onDeliver(shipment.id)}
                >
                  Mark Delivered
                </Button>
              )}
              {shipment.status === "Delivered" && (
                <span className="text-xs text-[var(--color-neutral-400)] italic">
                  Delivery finalized. No further actions required.
                </span>
              )}
            </div>
          </>
        ) : (
          <>
            <Field label="Ship date">
              <Input value={date} onChange={(e) => setDate(e.target.value)} />
            </Field>
            <Field label="Status">
              <Select value={status} onChange={(e) => setStatus(e.target.value as ShipmentStatus)}>
                {ALL_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </Field>
          </>
        )
      }
    </RecordDialog>
  );
}
