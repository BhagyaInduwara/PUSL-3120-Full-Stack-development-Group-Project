"use client";

import type { OrderStatus } from "@/domain/Order";
import {
  SalesIcon,
  ProductionIcon,
  InvoicingIcon,
  ShipmentIcon,
} from "@/components/icons";

export interface StageInfo {
  id: string;
  name: string;
  shortName: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

export const ORDER_STAGES: StageInfo[] = [
  {
    id: "placement",
    name: "Order Placed",
    shortName: "Order",
    icon: SalesIcon,
    description: "Draft reviewed & confirmed",
  },
  {
    id: "production",
    name: "Production & Stock",
    shortName: "Prod",
    icon: ProductionIcon,
    description: "Stock allocated or manufactured",
  },
  {
    id: "invoicing",
    name: "Invoicing",
    shortName: "Invoice",
    icon: InvoicingIcon,
    description: "Invoice issued to customer",
  },
  {
    id: "shipment",
    name: "Shipment",
    shortName: "Ship",
    icon: ShipmentIcon,
    description: "Dispatched & delivered",
  },
];

interface OrderStageTrackerProps {
  status: OrderStatus;
  variant?: "compact" | "detailed";
  className?: string;
}

/**
 * Calculates current progress across the 4 stages based on OrderStatus.
 * - Draft: Step 0 is active (unconfirmed)
 * - Confirmed: Step 0 done (Order Placed), Step 1 active (In Production)
 * - Invoiced: Steps 0, 1, 2 done (Order, Production, Invoicing), Step 3 active (Ready to Ship)
 * - Shipped: Steps 0, 1, 2 done, Step 3 active (In Transit)
 * - Closed: All steps 0, 1, 2, 3 completed (Delivered)
 */
export function getStageState(status: OrderStatus, stageIndex: number) {
  let completedThreshold = 0;
  let activeIndex = 0;

  switch (status) {
    case "Draft":
      completedThreshold = 0;
      activeIndex = 0;
      break;
    case "Confirmed":
      completedThreshold = 1;
      activeIndex = 1;
      break;
    case "Invoiced":
      completedThreshold = 3;
      activeIndex = 3;
      break;
    case "Shipped":
      completedThreshold = 3;
      activeIndex = 3;
      break;
    case "Closed":
      completedThreshold = 4;
      activeIndex = 4;
      break;
    default:
      completedThreshold = 0;
      activeIndex = 0;
  }

  const isCompleted = stageIndex < completedThreshold;
  const isActive = stageIndex === activeIndex && status !== "Closed";
  const isPending = stageIndex > activeIndex;

  return { isCompleted, isActive, isPending };
}

export function OrderStageTracker({
  status,
  variant = "compact",
  className = "",
}: OrderStageTrackerProps) {
  if (variant === "compact") {
    return (
      <div className={`flex flex-col gap-1 w-full pt-1.5 ${className}`}>
        <div className="flex items-center justify-between relative w-full">
          {ORDER_STAGES.map((stage, idx) => {
            const { isCompleted, isActive } = getStageState(status, idx);
            const Icon = stage.icon;
            const isLast = idx === ORDER_STAGES.length - 1;

            const activeLabel =
              idx === 3
                ? status === "Invoiced"
                  ? "Ready to Ship"
                  : "In Transit"
                : "In Progress";

            return (
              <div key={stage.id} className="flex items-center flex-1 last:flex-initial">
                {/* Stage Node */}
                <div
                  className="group relative flex flex-col items-center"
                  title={`${stage.name} (${isCompleted ? "Completed" : isActive ? activeLabel : "Pending"})`}
                >
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center transition-all duration-200 text-[10px] ${
                      isCompleted
                        ? "bg-[var(--color-accent)] text-[var(--color-neutral-900)] font-bold shadow-sm"
                        : isActive
                        ? "bg-[var(--color-neutral-800)] text-[var(--color-accent)] ring-1.5 ring-[var(--color-accent)] font-semibold shadow-[0_0_8px_rgba(var(--color-accent),0.25)]"
                        : "bg-[var(--color-neutral-800)] text-[var(--color-neutral-500)] border border-[var(--color-neutral-700)] opacity-60"
                    }`}
                  >
                    {isCompleted ? (
                      <svg className="w-3 h-3 stroke-[2.5]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      <Icon className="w-2.5 h-2.5" />
                    )}
                  </div>
                </div>

                {/* Connecting Line */}
                {!isLast && (
                  <div className="flex-1 h-[2px] mx-1 rounded-full overflow-hidden bg-[var(--color-neutral-800)]">
                    <div
                      className={`h-full transition-all duration-300 ${
                        isCompleted ? "bg-[var(--color-accent)] w-full" : "w-0"
                      }`}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Mini Stage Labels */}
        <div className="flex items-center justify-between text-[9px] text-[var(--color-neutral-400)] px-0.5 tracking-tight">
          {ORDER_STAGES.map((stage, idx) => {
            const { isCompleted, isActive } = getStageState(status, idx);
            return (
              <span
                key={stage.id}
                className={`transition-colors ${
                  isCompleted
                    ? "text-[var(--color-accent)] font-medium"
                    : isActive
                    ? "text-[var(--color-text)] font-semibold"
                    : "text-[var(--color-neutral-600)]"
                }`}
              >
                {stage.shortName}
              </span>
            );
          })}
        </div>
      </div>
    );
  }

  // Detailed variant for Order Details dialog
  return (
    <div
      className={`flex flex-col gap-3 p-3.5 rounded-lg border border-[var(--color-divider)] bg-[var(--color-neutral-900)]/60 ${className}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold tracking-wide text-[var(--color-neutral-300)] uppercase">
          Fulfillment Pipeline (4 Stages)
        </span>
        <span className="text-xs text-[var(--color-accent)] font-medium">
          {status === "Closed"
            ? "4 of 4 Steps Complete · Delivered"
            : status === "Shipped"
            ? "Stage 4 · In Transit"
            : status === "Invoiced"
            ? "3 of 4 Steps Complete · Ready to Ship"
            : status === "Confirmed"
            ? "Stage 2 · In Production"
            : "Stage 1 · Draft"}
        </span>
      </div>

      <div className="grid grid-cols-4 gap-2 pt-1">
        {ORDER_STAGES.map((stage, idx) => {
          const { isCompleted, isActive, isPending } = getStageState(status, idx);
          const Icon = stage.icon;
          const activeLabel =
            idx === 3
              ? status === "Invoiced"
                ? "Ready to Ship"
                : "In Transit"
              : "In Progress";

          return (
            <div
              key={stage.id}
              className={`flex flex-col gap-1.5 p-2.5 rounded-md border transition-all ${
                isCompleted
                  ? "bg-[var(--color-accent-800)]/20 border-[var(--color-accent)]/40 text-[var(--color-text)]"
                  : isActive
                  ? "bg-[var(--color-surface)] border-[var(--color-accent)] shadow-[0_0_12px_rgba(var(--color-accent),0.15)] text-[var(--color-text)]"
                  : "bg-transparent border-[var(--color-neutral-800)] text-[var(--color-neutral-500)] opacity-60"
              }`}
            >
              <div className="flex items-center justify-between">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                    isCompleted
                      ? "bg-[var(--color-accent)] text-[var(--color-neutral-900)] font-bold"
                      : isActive
                      ? "bg-[var(--color-neutral-800)] text-[var(--color-accent)] border border-[var(--color-accent)]"
                      : "bg-[var(--color-neutral-800)] text-[var(--color-neutral-500)] border border-[var(--color-neutral-700)]"
                  }`}
                >
                  {isCompleted ? (
                    <svg className="w-3.5 h-3.5 stroke-[2.5]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    <Icon className="w-3 h-3" />
                  )}
                </div>
                <span className="text-[10px] font-semibold text-[var(--color-neutral-400)]">
                  0{idx + 1}
                </span>
              </div>

              <div>
                <div
                  className={`text-xs font-semibold ${
                    isActive ? "text-[var(--color-accent)]" : ""
                  }`}
                >
                  {stage.name}
                </div>
                <div className="text-[11px] text-[var(--color-neutral-400)] line-clamp-1 mt-0.5">
                  {isCompleted
                    ? "Completed"
                    : isActive
                    ? activeLabel
                    : isPending
                    ? "Pending"
                    : stage.description}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
