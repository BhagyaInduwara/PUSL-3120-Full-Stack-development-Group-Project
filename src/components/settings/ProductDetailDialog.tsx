"use client";

import { useState } from "react";
import type { Product } from "@/domain/Product";
import { RecordDialog, RecordRow } from "@/components/ui/RecordDialog";
import { Field, Input } from "@/components/ui/Input";

export interface ProductEditableFields {
  name: string;
  category: string;
  price: number;
}

interface ProductDetailDialogProps {
  product: Product;
  onClose: () => void;
  onSave: (patch: ProductEditableFields) => void;
}

/**
 * ProductDetailDialog — popup opened from the Products table, same shell as
 * Order/Invoice/Shipment detail dialogs. SKU is the product's identity (see
 * Product.ts) and stays read-only even in edit mode; name/category/price
 * are the only editable fields. No status lifecycle, so always editable.
 */
export function ProductDetailDialog({ product, onClose, onSave }: ProductDetailDialogProps) {
  const [name, setName] = useState(product.name);
  const [category, setCategory] = useState(product.category);
  const [price, setPrice] = useState(product.price.dollars);

  const reset = () => {
    setName(product.name);
    setCategory(product.category);
    setPrice(product.price.dollars);
  };

  return (
    <RecordDialog
      title={product.name}
      subtitle={`Product · ${product.sku}`}
      editable
      onClose={onClose}
      onCancelEdit={reset}
      onSave={() => onSave({ name, category, price })}
    >
      {(mode) =>
        mode === "view" ? (
          <>
            <RecordRow label="SKU" value={product.sku} />
            <RecordRow label="Name" value={product.name} />
            <RecordRow label="Category" value={product.category} />
            <RecordRow label="Unit price" value={product.priceFormatted} />
          </>
        ) : (
          <>
            <RecordRow label="SKU" value={product.sku} />
            <Field label="Name">
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Field label="Category">
              <Input value={category} onChange={(e) => setCategory(e.target.value)} />
            </Field>
            <Field label="Unit price">
              <Input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value) || 0)} />
            </Field>
          </>
        )
      }
    </RecordDialog>
  );
}
