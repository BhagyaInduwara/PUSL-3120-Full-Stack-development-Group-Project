import type { Order } from "@/domain/Order";
import { Table, type Column } from "@/components/ui/Table";
import { StatusTag } from "@/components/ui/Tag";
import { OrderStageTracker } from "./OrderStageTracker";

const columns: Column<Order>[] = [
  { header: "Order", cell: (o) => <span className="font-semibold">{o.number}</span> },
  { header: "Customer", cell: (o) => o.customer },
  { header: "Items", cell: (o) => o.itemsSummary },
  { header: "Total Qty", cell: (o) => o.totalQty, className: "text-right" },
  { header: "Amount", cell: (o) => o.amountFormatted, className: "text-right font-semibold" },
  { header: "Date", cell: (o) => o.date, className: "text-[var(--color-neutral-500)]" },
  { header: "Status", cell: (o) => <StatusTag entity={o} /> },
  {
    header: "Pipeline Stage",
    cell: (o) => <OrderStageTracker status={o.status} variant="compact" className="w-[160px] pb-1" />,
  },
];

interface OrderTableProps {
  orders: Order[];
  onSelect: (order: Order) => void;
}

/** OrderTable — the Sales screen's flat table view, an alternative to the Kanban board. */
export function OrderTable({ orders, onSelect }: OrderTableProps) {
  return <Table columns={columns} rows={orders} rowKey={(o) => o.id} onRowClick={onSelect} />;
}

