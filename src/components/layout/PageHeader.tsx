import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

/** PageHeader — the title/subtitle/actions bar repeated at the top of every screen in the original design. */
export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between px-8 py-4 border-b border-[var(--color-divider)] bg-[var(--color-surface)]/85 backdrop-blur-md sticky top-0 z-20 transition-colors">
      <div>
        <h4 className="m-0 text-[18px] font-semibold tracking-tight text-[var(--color-text)]">{title}</h4>
        {subtitle && <div className="text-[13px] text-[var(--color-neutral-400)] mt-0.5">{subtitle}</div>}
      </div>
      {actions && <div className="flex gap-2.5 items-center">{actions}</div>}
    </div>
  );
}
