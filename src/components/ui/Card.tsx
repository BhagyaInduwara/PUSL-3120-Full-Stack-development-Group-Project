import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Elevation = "sm" | "md" | "lg" | "none";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  elevation?: Elevation;
  padded?: boolean;
  interactive?: boolean;
  bordered?: boolean;
  children?: ReactNode;
}

const shadows: Record<Elevation, string> = {
  none: "",
  sm: "shadow-[var(--shadow-sm)]",
  md: "shadow-[var(--shadow-md)]",
  lg: "shadow-[var(--shadow-lg)]",
};

/** Card — the app's one surface container (stat tiles, list rows, panels, drawers all wrap in this). */
export function Card({
  elevation = "sm",
  padded = true,
  interactive = false,
  bordered = true,
  className = "",
  children,
  ...rest
}: CardProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-[var(--radius-md)] bg-[var(--color-surface)] text-[var(--color-text)]",
        bordered && "border border-[var(--color-divider)] [box-shadow:var(--shadow-sm),var(--card-inset-highlight)]",
        padded && "p-[var(--space-4)]",
        shadows[elevation],
        interactive &&
          "cursor-pointer transition-all duration-150 hover:border-[color-mix(in_srgb,var(--color-divider)_50%,var(--color-accent)_50%)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]",
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardKicker({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "text-[11px] font-semibold tracking-wider uppercase text-[var(--color-accent)]",
        className
      )}
    >
      {children}
    </span>
  );
}

export function CardTitle({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "font-[family-name:var(--font-heading)] font-semibold text-[16px] text-[var(--color-text)] leading-tight",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardBody({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <p className={cn("m-0 text-[13px] text-[var(--color-neutral-400)] flex-1", className)}>{children}</p>;
}
