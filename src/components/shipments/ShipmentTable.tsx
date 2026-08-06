"use client";

import type { Shipment } from "@/domain/Shipment";
import { useERPStore } from "@/store/useERPStore";
import { Table, type Column } from "@/components/ui/Table";
import { StatusTag } from "@/components/ui/Tag";

/** ShipmentTable — dispatch/delivery tracking; customer is joined from the linked Order via ERPStore.shipmentCustomer. */
export function ShipmentTable({ shipments }: { shipments: Shipment[] }) {
  const store = useERPStore();

  const columns: Column<Shipment>[] = [
    { header: "Shipment", cell: (sh) => <span className="font-semibold">{sh.id}</span> },
    { header: "Customer", cell: (sh) => store.shipmentCustomer(sh) },
    { header: "Order", cell: (sh) => sh.orderId, className: "text-[var(--color-neutral-500)]" },
    { header: "Invoice", cell: (sh) => sh.invoiceLabel, className: "text-[var(--color-neutral-500)]" },
    { header: "Ship date", cell: (sh) => sh.date, className: "text-[var(--color-neutral-500)]" },
    { header: "Status", cell: (sh) => <StatusTag entity={sh} /> },
  ];

  return <Table columns={columns} rows={shipments} rowKey={(sh) => sh.id} />;
}
