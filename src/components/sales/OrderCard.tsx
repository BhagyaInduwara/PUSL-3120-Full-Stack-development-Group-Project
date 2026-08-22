import type { Order } from "@/domain/Order";
import { Card } from "@/components/ui/Card";
import { StatusTag } from "@/components/ui/Tag";
import { OrderStageTracker } from "./OrderStageTracker";

interface OrderCardProps {
  order: Order;
  onDragStart: (e: React.DragEvent) => void;
  onClick?: () => void;
}

/** OrderCard — one draggable Kanban card. Drag state (dataTransfer) is wired by the parent OrderColumn; onClick opens the OrderDetailDialog. */
export function OrderCard({ order, onDragStart, onClick }: OrderCardProps) {
  return (
    <Card draggable onDragStart={onDragStart} onClick={onClick} elevation="sm" className="cursor-grab gap-2">
      <div className="flex justify-between items-center">
        <span className="text-xs font-semibold">{order.id}</span>
        <StatusTag entity={order} />
      </div>
      <div className="text-[13px] font-medium">{order.customer}</div>
      <div className="text-xs text-[var(--color-neutral-500)] flex justify-between items-center">
        <span>{order.product}</span>
        <span>Qty {order.qty}</span>
      </div>
      <div className="text-[11px] text-[var(--color-neutral-500)] flex justify-between items-center">
        <span>{order.date}</span>
        <span className="font-medium text-[var(--color-text)]">{order.amountFormatted}</span>
      </div>
      <div className="pt-1 border-t border-[var(--color-divider)]">
        <OrderStageTracker status={order.status} variant="compact" />
      </div>
    </Card>
  );
}

