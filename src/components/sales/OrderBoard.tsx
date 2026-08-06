import type { DragEvent } from "react";
import type { Order, OrderStatus } from "@/domain/Order";
import { Tag } from "@/components/ui/Tag";
import { OrderCard } from "./OrderCard";

interface Column {
  status: OrderStatus;
  label: string;
  variant: "neutral" | "outline" | "accent" | "accent-2";
  dim?: boolean;
}

const COLUMNS: Column[] = [
  { status: "Draft", label: "Draft", variant: "neutral" },
  { status: "Confirmed", label: "Confirmed", variant: "outline" },
  { status: "Invoiced", label: "Invoiced", variant: "accent" },
  { status: "Shipped", label: "Shipped", variant: "accent-2" },
  { status: "Closed", label: "Closed", variant: "neutral", dim: true },
];

interface OrderBoardProps {
  orders: Order[];
  onMove: (orderId: string, status: OrderStatus) => void;
}

/** OrderBoard — 5-column drag-and-drop Kanban. Each column owns its own onDragOver/onDrop; dragged order id travels via the native DataTransfer API. */
export function OrderBoard({ orders, onMove }: OrderBoardProps) {
  const handleDrop = (status: OrderStatus) => (e: DragEvent) => {
    e.preventDefault();
    const orderId = e.dataTransfer.getData("text/plain");
    if (orderId) onMove(orderId, status);
  };

  return (
    <div className="grid grid-cols-5 gap-3.5 items-start">
      {COLUMNS.map((col) => {
        const columnOrders = orders.filter((o) => o.status === col.status);
        return (
          <div
            key={col.status}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop(col.status)}
            className="min-h-[120px]"
          >
            <div className={`flex items-center justify-between mb-2.5 ${col.dim ? "opacity-60" : ""}`}>
              <span className="text-xs font-semibold tracking-wide">{col.label}</span>
              <Tag variant={col.variant}>{columnOrders.length}</Tag>
            </div>
            <div className="flex flex-col gap-2.5">
              {columnOrders.map((order) => (
                <div key={order.id} className={col.dim ? "opacity-70" : ""}>
                  <OrderCard
                    order={order}
                    onDragStart={(e) => e.dataTransfer.setData("text/plain", order.id)}
                  />
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
