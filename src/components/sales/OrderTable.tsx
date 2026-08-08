import type { Order } from "@/domain/Order";
import { Table, type Column } from "@/components/ui/Table";
import { StatusTag } from "@/components/ui/Tag";

const columns: Column<Order>[] = [
  { header: "Order", cell: (o) => <span className="font-semibold">{o.id}</span> },
  { header: "Customer", cell: (o) => o.customer },
  { header: "Product", cell: (o) => o.product },
  { header: "Qty", cell: (o) => o.qty },
  { header: "Price", cell: (o) => o.priceFormatted },
  { header: "Date", cell: (o) => o.date, className: "text-[var(--color-neutral-500)]" },
  { header: "Status", cell: (o) => <StatusTag entity={o} /> },
];

interface OrderTableProps {
  orders: Order[];
  onSelect: (order: Order) => void;
}

/** OrderTable — the Sales screen's flat table view, an alternative to the Kanban board. */
export function OrderTable({ orders, onSelect }: OrderTableProps) {
  return <Table columns={columns} rows={orders} rowKey={(o) => o.id} onRowClick={onSelect} />;
}
