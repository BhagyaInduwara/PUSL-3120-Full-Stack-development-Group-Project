import type { Order, OrderStatus } from "@/domain/Order";
import { Card } from "@/components/ui/Card";
import { StatusTag, Tag } from "@/components/ui/Tag";
import { StatusPalette } from "@/domain/StatusBadge";
import { OrderStageTracker } from "./OrderStageTracker";

interface OrderCardProps {
  order: Order;
  /** Set while this card has a drag-and-drop move awaiting Save/Undo (see sales/page.tsx) — shows the target status instead of the real one, and a dashed outline so it reads as unconfirmed. */
  pendingStatus?: OrderStatus;
  showStages?: boolean;
  onDragStart: (e: React.DragEvent) => void;
  onClick?: () => void;
}

const VISIBLE_ITEMS = 2;

/** OrderCard — one draggable Kanban card. Shows up to two line items, then "+N more item(s)", date/amount, and optional 4-stage pipeline stepper. */
export function OrderCard({ order, pendingStatus, showStages = true, onDragStart, onClick }: OrderCardProps) {
  const visible = order.lineItems.slice(0, VISIBLE_ITEMS);
  const extra = order.lineItems.length - visible.length;

  return (
    <Card
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      elevation="sm"
      className={`cursor-grab gap-2 ${pendingStatus ? "border border-dashed border-[var(--color-accent)]" : ""}`}
    >
      <div className="flex justify-between items-center">
        <span className="text-xs font-semibold">{order.number}</span>
        {pendingStatus ? <Tag style={StatusPalette.styleFor(pendingStatus)}>{pendingStatus}</Tag> : <StatusTag entity={order} />}
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
        <span>{order.date}</span>
        <span className="font-medium text-[var(--color-text)]">{order.amountFormatted}</span>
      </div>

      {showStages && (
        <div className="pt-1 border-t border-[var(--color-divider)]">
          <OrderStageTracker status={pendingStatus ?? order.status} variant="compact" />
        </div>
      )}
    </Card>
  );
}
