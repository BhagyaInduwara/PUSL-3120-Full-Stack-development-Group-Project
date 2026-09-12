import { CardTitle } from "@/components/ui/Card";

export interface ActivityItem {
  text: string;
  time: string;
}

/** ActivityFeed — the recent-activity list on the Dashboard's right column. */
export function ActivityFeed({ items }: { items: ActivityItem[] }) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-baseline justify-between mb-4">
        <CardTitle className="text-base text-slate-900 font-semibold m-0">Recent activity</CardTitle>
        <span className="text-xs font-medium text-slate-400 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">
          Live feed
        </span>
      </div>
      {!items || items.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-12 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
          No recent activity recorded.
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-slate-100 flex-1 justify-around">
          {items.map((item, i) => (
            <div key={i} className="flex gap-3.5 py-3.5 group items-start">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1 flex-none shadow-xs group-hover:scale-125 transition-transform" />
              <div className="min-w-0 flex-1">
                <div className="text-[13px] leading-relaxed text-slate-800 font-medium">{item.text}</div>
                <div className="text-[11px] text-slate-400 mt-1">{item.time}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
