import type { ComponentType, ReactNode, SVGProps } from "react";
import { CardKicker } from "@/components/ui/Card";
import { CountUp } from "@/components/ui/CountUp";

interface StatCardProps {
  kicker: string;
  value: ReactNode;
  description: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  valueClassName?: string;
}

export function StatCard({ kicker, value, description, Icon, valueClassName = "" }: StatCardProps) {
  return (
    <div className="flex-1 p-5 transition-colors hover:bg-[var(--color-surface-hover)] group">
      <div className="flex items-center justify-between">
        <CardKicker>{kicker}</CardKicker>
        <div className="p-2 rounded-xl bg-[var(--color-accent)]/10 text-[var(--color-accent)] border border-[var(--color-accent)]/20 group-hover:bg-[var(--color-accent)]/15 transition-colors">
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div
        className={`font-[family-name:var(--font-heading)] text-[26px] font-bold tracking-tight text-[var(--color-text)] tabular-nums mt-1.5 ${valueClassName}`}
      >
        {typeof value === "number" ? <CountUp to={value} /> : value}
      </div>
      <div className="text-[12px] text-[var(--color-neutral-400)] mt-0.5">{description}</div>
    </div>
  );
}
