import type { Order } from "@/domain/Order";
import { Card } from "@/components/ui/Card";
import { StatusTag } from "@/components/ui/Tag";

/** OrderCard — one draggable Kanban card. Drag state (dataTransfer) is wired by the parent OrderColumn. */
export function OrderCard({ order, onDragStart }: { order: Order; onDragStart: (e: React.DragEvent) => void }) {
  return (
    <Card draggable onDragStart={onDragStart} elevation="sm" className="cursor-grab gap-1.5">
      <div className="flex justify-between items-center">
        <span className="text-xs font-semibold">{order.id}</span>
        <StatusTag entity={order} />
      </div>
      <div className="text-[13px]">{order.customer}</div>
      <div className="text-xs text-[var(--color-neutral-500)]">
        {order.product} · Qty {order.qty}
      </div>
      <div className="text-[11px] text-[var(--color-neutral-500)]">{order.date}</div>
    </Card>
  );
}
