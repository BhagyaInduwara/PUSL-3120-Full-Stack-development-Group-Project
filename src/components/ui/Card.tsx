import type { HTMLAttributes, ReactNode } from "react";

type Elevation = "sm" | "md" | "lg" | "none";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  elevation?: Elevation;
  padded?: boolean;
  children?: ReactNode;
}

const shadows: Record<Elevation, string> = {
  none: "",
  sm: "shadow-[var(--shadow-sm)]",
  md: "shadow-[var(--shadow-md)]",
  lg: "shadow-[var(--shadow-lg)]",
};

/** Card — the app's one surface container (stat tiles, list rows, panels, drawers all wrap in this). */
export function Card({ elevation = "sm", padded = true, className = "", children, ...rest }: CardProps) {
  return (
    <div
      className={`flex flex-col gap-2 rounded-[var(--radius-md)] bg-[var(--color-surface)] ${
        padded ? "p-[var(--space-3)]" : ""
      } ${shadows[elevation]} ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardKicker({ children }: { children: ReactNode }) {
  return <span className="text-[11px] font-semibold tracking-wider uppercase text-emerald-600">{children}</span>;
}

export function CardTitle({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`font-[family-name:var(--font-heading)] font-semibold text-[16px] text-slate-900 leading-tight ${className}`}>
      {children}
    </div>
  );
}

export function CardBody({ children }: { children: ReactNode }) {
  return <p className="m-0 text-[13px] opacity-80 flex-1">{children}</p>;
}
