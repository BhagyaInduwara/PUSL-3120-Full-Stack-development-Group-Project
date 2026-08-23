"use client";

import { useState } from "react";
import type { Order, OrderEditableFields, OrderLineItem } from "@/domain/Order";
import { RecordDialog, RecordRow } from "@/components/ui/RecordDialog";
import { StatusTag } from "@/components/ui/Tag";
import { Field, Input } from "@/components/ui/Input";
import { OrderStageTracker } from "./OrderStageTracker";

interface OrderDetailDialogProps {
  order: Order;
  onClose: () => void;
  onSave: (patch: Partial<OrderEditableFields>) => void;
}

/** OrderDetailDialog — popup opened from the Sales board/table. Editable only while the order is still a Draft (Order.canEdit). */
export function OrderDetailDialog({ order, onClose, onSave }: OrderDetailDialogProps) {
  const [customer, setCustomer] = useState(order.customer);
  const [lineItems, setLineItems] = useState<OrderLineItem[]>(order.lineItems.map((li) => ({ ...li })));
  const [date, setDate] = useState(order.date);

  const reset = () => {
    setCustomer(order.customer);
    setLineItems(order.lineItems.map((li) => ({ ...li })));
    setDate(order.date);
  };

  function handleLineItemChange(index: number, patch: Partial<OrderLineItem>) {
    setLineItems((prev) => prev.map((li, i) => (i === index ? { ...li, ...patch } : li)));
  }

  return (
    <RecordDialog
      title={order.number}
      subtitle={`Order · ${order.customer}`}
      statusBadge={<StatusTag entity={order} />}
      editable={order.canEdit}
      onClose={onClose}
      onCancelEdit={reset}
      onSave={() => onSave({ customer, lineItems, date })}
    >
      {(mode) =>
        mode === "view" ? (
          <>
            <OrderStageTracker status={order.status} variant="detailed" className="mb-1" />
            <div className="flex flex-col gap-1">
              <RecordRow label="Customer" value={order.customer} />
              {order.lineItems.map((li, i) => (
                <RecordRow key={i} label={li.product} value={`×${li.qty} @ $${li.price}`} />
              ))}
              <RecordRow label="Amount" value={order.amountFormatted} />
              <RecordRow label="Date" value={order.date} />
            </div>
          </>
        ) : (
          <>
            <Field label="Customer">
              <Input value={customer} onChange={(e) => setCustomer(e.target.value)} />
            </Field>

            <div>
              <label className="block text-xs mb-1.5 text-[color-mix(in_srgb,var(--color-text)_70%,transparent)]">
                Line items
              </label>
              <div className="flex flex-col gap-2">
                {lineItems.map((li, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-[1fr_56px_76px] gap-2 items-end p-2.5 rounded-lg bg-[var(--color-surface)] border border-[var(--color-divider)]"
                  >
                    <div className="text-[13px]">{li.product}</div>
                    <Input
                      type="number"
                      className="text-center px-1.5 py-1"
                      value={li.qty}
                      onChange={(e) => handleLineItemChange(i, { qty: Number(e.target.value) || 0 })}
                    />
                    <Input
                      type="number"
                      className="text-right px-1.5 py-1"
                      value={li.price}
                      onChange={(e) => handleLineItemChange(i, { price: Number(e.target.value) || 0 })}
                    />
                  </div>
                ))}
              </div>
            </div>

            <Field label="Date">
              <Input value={date} onChange={(e) => setDate(e.target.value)} />
            </Field>
          </>
        )
      }
    </RecordDialog>
  );
}
