import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

/** PageHeader — the title/subtitle/actions bar repeated at the top of every screen in the original design. */
export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between px-8 pt-[22px] pb-[18px] border-b border-[var(--color-divider)]">
      <div>
        <h4 className="m-0 mb-1">{title}</h4>
        {subtitle && <div className="text-[13px] text-[var(--color-neutral-500)]">{subtitle}</div>}
      </div>
      {actions && <div className="flex gap-2.5 items-center">{actions}</div>}
    </div>
  );
}
