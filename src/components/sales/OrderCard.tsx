import type { Order } from "@/domain/Order";
import { Card } from "@/components/ui/Card";
import { StatusTag } from "@/components/ui/Tag";

interface OrderCardProps {
  order: Order;
  /** Precomputed by the page (joins the order's line items against Production Jobs) — see OrderBoard.productionStatusFor. */
  productionStatusWord: string;
  onDragStart: (e: React.DragEvent) => void;
  onClick?: () => void;
}

const VISIBLE_ITEMS = 2;

/** OrderCard — one draggable Kanban card. Shows up to two line items, then "+N more item(s)", then a date/production-status/amount footer. */
export function OrderCard({ order, productionStatusWord, onDragStart, onClick }: OrderCardProps) {
  const visible = order.lineItems.slice(0, VISIBLE_ITEMS);
  const extra = order.lineItems.length - visible.length;

  return (
    <Card draggable onDragStart={onDragStart} onClick={onClick} elevation="sm" className="cursor-grab gap-2">
      <div className="flex justify-between items-center">
        <span className="text-xs font-semibold">{order.number}</span>
        <StatusTag entity={order} />
      </div>
      <div className="text-[13px] font-medium">{order.customer}</div>

      <div className="flex flex-col gap-0.5">
        {visible.map((li, i) => (
          <div key={i} className="text-xs text-[var(--color-neutral-500)] flex justify-between items-center gap-2">
            <span className="truncate">{li.product}</span>
            <span className="flex-none">×{li.qty}</span>
          </div>
        ))}
        {extra > 0 && (
          <div className="text-[11px] text-[var(--color-neutral-500)] italic">
            +{extra} more item{extra > 1 ? "s" : ""}
          </div>
        )}
      </div>

      <div className="text-[11px] text-[var(--color-neutral-500)] flex justify-between items-center pt-1 border-t border-[var(--color-divider)]">
        <span>
          {order.date} · {productionStatusWord}
        </span>
        <span className="font-medium text-[var(--color-text)]">{order.amountFormatted}</span>
      </div>
    </Card>
  );
}
