"use client";

import type { Shipment } from "@/domain/Shipment";
import type { Order } from "@/domain/Order";
import { Table, type Column } from "@/components/ui/Table";
import { StatusTag } from "@/components/ui/Tag";

interface ShipmentTableProps {
  shipments: Shipment[];
  /** Keyed by Shipment.orderId — the page fetches this from the real API's populated order, not ERPStore. */
  orderById: Map<string, Order>;
  onSelect: (shipment: Shipment) => void;
}

/** ShipmentTable — dispatch/delivery tracking; customer is joined from the linked Order, passed in via orderById. */
export function ShipmentTable({ shipments, orderById, onSelect }: ShipmentTableProps) {
  const columns: Column<Shipment>[] = [
    { header: "Shipment", cell: (sh) => <span className="font-semibold">{sh.number}</span> },
    { header: "Customer", cell: (sh) => orderById.get(sh.orderId)?.customer ?? "—" },
    { header: "Order", cell: (sh) => orderById.get(sh.orderId)?.number ?? sh.orderId, className: "text-[var(--color-neutral-500)]" },
    { header: "Invoice", cell: (sh) => sh.invoiceLabel, className: "text-[var(--color-neutral-500)]" },
    { header: "Ship date", cell: (sh) => sh.date, className: "text-[var(--color-neutral-500)]" },
    { header: "Status", cell: (sh) => <StatusTag entity={sh} /> },
  ];

  return <Table columns={columns} rows={shipments} rowKey={(sh) => sh.id} onRowClick={onSelect} />;
}
