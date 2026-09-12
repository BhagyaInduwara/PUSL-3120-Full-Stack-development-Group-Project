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

const STATUS_ACCENT_LINE: Record<OrderStatus, string> = {
  Draft: "from-slate-400/80 to-slate-400/20",
  Confirmed: "from-amber-500/80 to-amber-500/20",
  Invoiced: "from-emerald-500/80 to-emerald-500/20",
  Shipped: "from-teal-400/80 to-teal-400/20",
  Closed: "from-neutral-500/60 to-neutral-500/10",
};

/** OrderCard — one draggable Kanban card. Shows up to two line items, then "+N more item(s)", date/amount, and optional 4-stage pipeline stepper. */
export function OrderCard({ order, pendingStatus, showStages = true, onDragStart, onClick }: OrderCardProps) {
  const visible = order.lineItems.slice(0, VISIBLE_ITEMS);
  const extra = order.lineItems.length - visible.length;
  const currentStatus = pendingStatus ?? order.status;

  return (
    <Card
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      elevation="sm"
      className={`relative overflow-hidden cursor-grab active:cursor-grabbing gap-2 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md ${
        pendingStatus ? "border border-dashed border-[var(--color-accent)]" : ""
      }`}
    >
      <div className={`absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r ${STATUS_ACCENT_LINE[currentStatus]}`} />

      <div className="flex justify-between items-center pt-0.5">
        <span className="text-xs font-semibold tracking-tight">{order.number}</span>
        {pendingStatus ? <Tag style={StatusPalette.styleFor(pendingStatus)}>{pendingStatus}</Tag> : <StatusTag entity={order} />}
      </div>
      <div className="text-[13.5px] font-medium text-[var(--color-text)] leading-snug">{order.customer}</div>

      <div className="flex flex-col gap-0.5">
        {visible.map((li, i) => (
          <div key={i} className="text-xs text-[var(--color-neutral-400)] flex justify-between items-center gap-2">
            <span className="truncate">{li.product}</span>
            <span className="flex-none tabular-nums font-medium">×{li.qty}</span>
          </div>
        ))}
        {extra > 0 && (
          <div className="text-[11px] text-[var(--color-neutral-400)] italic">
            +{extra} more item{extra > 1 ? "s" : ""}
          </div>
        )}
      </div>

      <div className="text-[11px] text-[var(--color-neutral-400)] flex justify-between items-center pt-1.5 border-t border-[var(--color-divider)]">
        <span className="tabular-nums">{order.date}</span>
        <span className="font-semibold text-[var(--color-text)] tabular-nums">{order.amountFormatted}</span>
      </div>

      {showStages && (
        <div className="pt-1.5 border-t border-[var(--color-divider)]">
          <OrderStageTracker status={pendingStatus ?? order.status} variant="compact" />
        </div>
      )}
    </Card>
  );
}
