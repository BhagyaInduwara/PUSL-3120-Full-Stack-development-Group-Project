"use client";

import { useState } from "react";
import type { Invoice, InvoiceEditableFields } from "@/domain/Invoice";
import type { Order } from "@/domain/Order";
import { RecordDialog, RecordRow } from "@/components/ui/RecordDialog";
import { StatusTag } from "@/components/ui/Tag";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";

interface InvoiceDetailDialogProps {
  invoice: Invoice;
  order: Order | undefined;
  onClose: () => void;
  onSave: (patch: Partial<InvoiceEditableFields>) => void;
  onMarkPaid: () => void;
}

/** InvoiceDetailDialog — popup opened from the Invoicing table. Editable only while the invoice is still a Draft (Invoice.canEdit); amount/customer/line item are read-only here since they're derived from the linked Order. */
export function InvoiceDetailDialog({ invoice, order, onClose, onSave, onMarkPaid }: InvoiceDetailDialogProps) {
  const [issueDate, setIssueDate] = useState(invoice.issueDate);
  const [dueDate, setDueDate] = useState(invoice.dueDate);

  const reset = () => {
    setIssueDate(invoice.issueDate);
    setDueDate(invoice.dueDate);
  };

  return (
    <RecordDialog
      title={invoice.number}
      subtitle={`Invoice · linked order ${order?.number ?? invoice.orderId}`}
      statusBadge={<StatusTag entity={invoice} />}
      editable={invoice.canEdit}
      onClose={onClose}
      onCancelEdit={reset}
      onSave={() => onSave({ issueDate, dueDate })}
    >
      {(mode) =>
        mode === "view" ? (
          <>
            <RecordRow label="Bill to" value={order?.customer ?? "—"} />
            {order && order.lineItems.length > 0 ? (
              order.lineItems.map((li, i) => (
                <RecordRow key={i} label={li.product} value={`×${li.qty}`} />
              ))
            ) : (
              <RecordRow label="Items" value="—" />
            )}
            <RecordRow label="Issue date" value={invoice.issueDate} />
            <RecordRow label="Due date" value={invoice.dueDate} />
            <RecordRow label="Total" value={order?.amountFormatted ?? "—"} />
            <div className="flex gap-2.5 pt-1">
              <Button variant="primary" onClick={onMarkPaid} disabled={invoice.status === "Paid"}>
                Mark as paid
              </Button>
              <Button variant="secondary">Send reminder</Button>
              <Button variant="ghost">Download PDF</Button>
            </div>
          </>
        ) : (
          <>
            <Field label="Issue date">
              <Input value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
            </Field>
            <Field label="Due date">
              <Input value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </Field>
          </>
        )
      }
    </RecordDialog>
  );
}
