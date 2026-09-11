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
    <div className="flex-1 p-5 transition-colors hover:bg-slate-50/70 group">
      <div className="flex items-center justify-between">
        <CardKicker>{kicker}</CardKicker>
        <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100/80 group-hover:bg-emerald-100/70 transition-colors">
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div
        className={`font-[family-name:var(--font-heading)] text-[26px] font-bold tracking-tight text-slate-900 tabular-nums mt-1.5 ${valueClassName}`}
      >
        {typeof value === "number" ? <CountUp to={value} /> : value}
      </div>
      <div className="text-[12px] text-slate-500 mt-0.5">{description}</div>
    </div>
  );
}
