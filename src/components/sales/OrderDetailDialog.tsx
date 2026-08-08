"use client";

import { useState } from "react";
import type { Order, OrderEditableFields } from "@/domain/Order";
import { RecordDialog, RecordRow } from "@/components/ui/RecordDialog";
import { StatusTag } from "@/components/ui/Tag";
import { Field, Input } from "@/components/ui/Input";

interface OrderDetailDialogProps {
  order: Order;
  onClose: () => void;
  onSave: (patch: Partial<OrderEditableFields>) => void;
}

/** OrderDetailDialog — popup opened from the Sales board/table. Editable only while the order is still a Draft (Order.canEdit). */
export function OrderDetailDialog({ order, onClose, onSave }: OrderDetailDialogProps) {
  const [customer, setCustomer] = useState(order.customer);
  const [product, setProduct] = useState(order.product);
  const [qty, setQty] = useState(order.qty);
  const [price, setPrice] = useState(order.price.dollars);
  const [date, setDate] = useState(order.date);

  const reset = () => {
    setCustomer(order.customer);
    setProduct(order.product);
    setQty(order.qty);
    setPrice(order.price.dollars);
    setDate(order.date);
  };

  return (
    <RecordDialog
      title={order.id}
      subtitle={`Order · ${order.customer}`}
      statusBadge={<StatusTag entity={order} />}
      editable={order.canEdit}
      onClose={onClose}
      onCancelEdit={reset}
      onSave={() => onSave({ customer, product, qty, price, date })}
    >
      {(mode) =>
        mode === "view" ? (
          <>
            <RecordRow label="Customer" value={order.customer} />
            <RecordRow label="Product" value={order.product} />
            <RecordRow label="Quantity" value={order.qty} />
            <RecordRow label="Unit price" value={order.priceFormatted} />
            <RecordRow label="Amount" value={order.amountFormatted} />
            <RecordRow label="Date" value={order.date} />
          </>
        ) : (
          <>
            <Field label="Customer">
              <Input value={customer} onChange={(e) => setCustomer(e.target.value)} />
            </Field>
            <Field label="Product">
              <Input value={product} onChange={(e) => setProduct(e.target.value)} />
            </Field>
            <Field label="Quantity">
              <Input type="number" value={qty} onChange={(e) => setQty(Number(e.target.value) || 0)} />
            </Field>
            <Field label="Unit price">
              <Input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value) || 0)} />
            </Field>
            <Field label="Date">
              <Input value={date} onChange={(e) => setDate(e.target.value)} />
            </Field>
          </>
        )
      }
    </RecordDialog>
  );
}
