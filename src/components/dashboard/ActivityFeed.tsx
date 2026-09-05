import { CardTitle } from "@/components/ui/Card";

export interface ActivityItem {
  text: string;
  time: string;
}

/** ActivityFeed — the recent-activity list on the Dashboard's right column. */
export function ActivityFeed({ items }: { items: ActivityItem[] }) {
  return (
    <div className="flex flex-col gap-0.5">
      <CardTitle className="mb-2">Recent activity</CardTitle>
      {!items || items.length === 0 ? (
        <div className="py-6 text-center text-xs text-[var(--color-neutral-500)] border border-dashed border-[var(--color-divider)] rounded-md">
          No recent activity recorded.
        </div>
      ) : (
        items.map((item, i) => (
          <div key={i} className="flex gap-2.5 py-2.5 border-b border-[var(--color-divider)] last:border-b-0">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] mt-1.5 flex-none" />
            <div className="min-w-0">
              <div className="text-[13px] leading-snug">{item.text}</div>
              <div className="text-[11px] text-[var(--color-neutral-500)] mt-0.5">{item.time}</div>
            </div>
          </div>
        ))
      )}

    </div>
  );
}
