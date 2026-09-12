import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-[var(--radius-sm)] bg-[var(--color-surface-hover)] border border-[var(--color-divider)]/40",
        className
      )}
      {...props}
    />
  );
}

export function StatCardsSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="p-5 rounded-[var(--radius-md)] bg-[var(--color-surface)] border border-[var(--color-divider)] shadow-xs flex flex-col gap-3"
        >
          <div className="flex justify-between items-center">
            <Skeleton className="h-3.5 w-20" />
            <Skeleton className="h-8 w-8 rounded-xl" />
          </div>
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-3 w-32" />
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-divider)] bg-[var(--color-surface)] overflow-hidden shadow-xs">
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-[var(--color-divider)] bg-[var(--color-surface-subtle)]">
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="h-3.5 w-16" />
      </div>
      <div className="divide-y divide-[var(--color-divider)]/60">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3.5">
            {Array.from({ length: cols }).map((_, j) => (
              <Skeleton
                key={j}
                className={cn(
                  "h-4",
                  j === 0 ? "w-24" : j === 1 ? "w-40 flex-1" : j === cols - 1 ? "w-20" : "w-24"
                )}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function BoardSkeleton({ columns = 5 }: { columns?: number }) {
  return (
    <div className="grid grid-cols-5 gap-3.5 items-start">
      {Array.from({ length: columns }).map((_, i) => (
        <div
          key={i}
          className="min-h-[220px] rounded-xl bg-[var(--color-surface-subtle)]/50 p-2.5 border border-[var(--color-divider)]/50 flex flex-col gap-3"
        >
          <div className="flex justify-between items-center px-1">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-6 rounded-full" />
          </div>
          <div className="flex flex-col gap-2.5">
            <Skeleton className="h-32 rounded-lg" />
            <Skeleton className="h-28 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-8 max-w-[1440px] mx-auto w-full animate-fade-in">
      <StatCardsSkeleton />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 rounded-[var(--radius-md)] bg-[var(--color-surface)] border border-[var(--color-divider)] shadow-xs flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-[220px] w-full rounded-lg" />
        </div>

        <div className="p-6 rounded-[var(--radius-md)] bg-[var(--color-surface)] border border-[var(--color-divider)] shadow-xs flex flex-col gap-4">
          <Skeleton className="h-4 w-28" />
          <div className="flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex justify-between items-center gap-2">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-3.5 w-12" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TableSkeleton rows={4} cols={3} />
        <TableSkeleton rows={4} cols={3} />
      </div>
    </div>
  );
}
