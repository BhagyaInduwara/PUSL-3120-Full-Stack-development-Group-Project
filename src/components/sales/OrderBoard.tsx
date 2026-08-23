import type { DragEvent } from "react";
import type { Order, OrderStatus } from "@/domain/Order";
import type { ProductionJob } from "@/domain/ProductionJob";
import { Money } from "@/domain/Money";
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

interface PendingMove {
  orderId: string;
  status: OrderStatus;
}

interface OrderBoardProps {
  orders: Order[];
  jobs: ProductionJob[];
  /** A drag that's moved a card but hasn't been Saved yet — see sales/page.tsx. The card renders in its target column with a dashed outline until confirmed. */
  pendingMove: PendingMove | null;
  onMove: (orderId: string, status: OrderStatus) => void;
  onSelect: (order: Order) => void;
}

/** The status a card should render/group under — its pending target if one's in flight, otherwise its real status. */
function displayStatus(order: Order, pendingMove: PendingMove | null): OrderStatus {
  return pendingMove && pendingMove.orderId === order.id ? pendingMove.status : order.status;
}

/** Finds a Production Job whose product matches any of the order's line items, and returns a display word for its status; "Not planned" if none matches. */
function productionStatusFor(order: Order, jobs: ProductionJob[]): string {
  const products = new Set(order.lineItems.map((li) => li.product));
  const job = jobs.find((j) => products.has(j.product));
  return job ? job.status : "Not planned";
}

/** OrderBoard — 5-column drag-and-drop Kanban. Each column owns its own onDragOver/onDrop; dragged order id travels via the native DataTransfer API. */
export function OrderBoard({ orders, jobs, pendingMove, onMove, onSelect }: OrderBoardProps) {
  const handleDrop = (status: OrderStatus) => (e: DragEvent) => {
    e.preventDefault();
    const orderId = e.dataTransfer.getData("text/plain");
    if (orderId) onMove(orderId, status);
  };

  return (
    <div className="grid grid-cols-5 gap-3.5 items-start">
      {COLUMNS.map((col) => {
        const columnOrders = orders.filter((o) => displayStatus(o, pendingMove) === col.status);
        const columnTotal = columnOrders.reduce((sum, o) => sum.add(o.amount), Money.zero());
        return (
          <div
            key={col.status}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop(col.status)}
            className="min-h-[120px]"
          >
            <div className={`flex items-center justify-between mb-2.5 ${col.dim ? "opacity-60" : ""}`}>
              <span className="text-xs font-semibold tracking-wide">
                {col.label} <span className="font-normal text-[var(--color-neutral-500)]">{columnTotal.format()}</span>
              </span>
              <Tag variant={col.variant}>{columnOrders.length}</Tag>
            </div>
            <div className="flex flex-col gap-2.5">
              {columnOrders.map((order) => (
                <div key={order.id} className={col.dim ? "opacity-70" : ""}>
                  <OrderCard
                    order={order}
                    productionStatusWord={productionStatusFor(order, jobs)}
                    pendingStatus={pendingMove?.orderId === order.id ? pendingMove.status : undefined}
                    onDragStart={(e) => e.dataTransfer.setData("text/plain", order.id)}
                    onClick={() => onSelect(order)}
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
