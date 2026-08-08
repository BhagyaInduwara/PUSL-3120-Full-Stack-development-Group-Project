"use client";

import { useState } from "react";
import type { Shipment, ShipmentEditableFields } from "@/domain/Shipment";
import { RecordDialog, RecordRow } from "@/components/ui/RecordDialog";
import { StatusTag } from "@/components/ui/Tag";
import { Field, Input } from "@/components/ui/Input";

interface ShipmentDetailDialogProps {
  shipment: Shipment;
  customer: string;
  onClose: () => void;
  onSave: (patch: Partial<ShipmentEditableFields>) => void;
}

/** ShipmentDetailDialog — popup opened from the Shipments table. Editable only while the shipment is still a Draft (Shipment.canEdit). */
export function ShipmentDetailDialog({ shipment, customer, onClose, onSave }: ShipmentDetailDialogProps) {
  const [date, setDate] = useState(shipment.date);

  const reset = () => setDate(shipment.date);

  return (
    <RecordDialog
      title={shipment.id}
      subtitle={`Shipment · ${customer}`}
      statusBadge={<StatusTag entity={shipment} />}
      editable={shipment.canEdit}
      onClose={onClose}
      onCancelEdit={reset}
      onSave={() => onSave({ date })}
    >
      {(mode) =>
        mode === "view" ? (
          <>
            <RecordRow label="Customer" value={customer} />
            <RecordRow label="Order" value={shipment.orderId} />
            <RecordRow label="Invoice" value={shipment.invoiceLabel} />
            <RecordRow label="Ship date" value={shipment.date} />
          </>
        ) : (
          <Field label="Ship date">
            <Input value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
        )
      }
    </RecordDialog>
  );
}
