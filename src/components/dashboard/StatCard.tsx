import type { ComponentType, ReactNode, SVGProps } from "react";
import { Card, CardKicker } from "@/components/ui/Card";

interface StatCardProps {
  kicker: string;
  value: ReactNode;
  description: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  valueClassName?: string;
}

/** StatCard — one of the four summary tiles at the top of the Dashboard. */
export function StatCard({ kicker, value, description, Icon, valueClassName = "" }: StatCardProps) {
  return (
    <Card elevation="sm">
      <div className="flex items-center justify-between">
        <CardKicker>{kicker}</CardKicker>
        <Icon />
      </div>
      <div className={`font-[family-name:var(--font-heading)] text-[30px] font-medium ${valueClassName}`}>
        {value}
      </div>
      <div className="text-[13px] opacity-80 m-0">{description}</div>
    </Card>
  );
}
