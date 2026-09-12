import { CardTitle } from "@/components/ui/Card";

export interface CategorySalesItem {
  category: string;
  units: number;
  percentage: number;
  color: string;
}

export interface SalesByCategoryCardProps {
  categories: CategorySalesItem[];
  totalUnits: number;
}

export function SalesByCategoryCard({ categories, totalUnits }: SalesByCategoryCardProps) {
  const radius = 80;
  const strokeWidth = 16;
  const circumference = 2 * Math.PI * radius;

  const segments = categories.map((item, i) => {
    const priorCumulative = categories.slice(0, i).reduce((sum, c) => sum + c.percentage, 0);
    const strokeDasharray = `${(item.percentage / 100) * circumference} ${circumference}`;
    const strokeDashoffset = -((priorCumulative / 100) * circumference);
    return {
      ...item,
      strokeDasharray,
      strokeDashoffset,
    };
  });

  return (
    <div className="bg-white rounded-2xl p-7 border border-slate-200/80 shadow-xs flex flex-col justify-between min-h-[460px] gap-6">
      <div>
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div>
            <CardTitle className="text-lg">Sales by Category</CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">
              Product sales volume distribution across categories
            </p>
          </div>
          <span className="text-[11px] text-slate-500 font-medium bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200/60 shadow-xs">
            Total: {totalUnits} units
          </span>
        </div>

      {totalUnits === 0 ? (
        <div className="py-12 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
          No category sales recorded yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] items-center gap-8 pt-2">
        {/* Scaled SVG Donut Chart */}
        <div className="relative flex justify-center items-center py-2">
          <svg viewBox="0 0 200 200" width={200} height={200} className="-rotate-90 transform">
            {/* Track */}
            <circle
              cx={100}
              cy={100}
              r={radius}
              fill="none"
              stroke="#f1f5f9"
              strokeWidth={strokeWidth}
            />
            {/* Colored Segments */}
            {segments.map((segment) => (
              <circle
                key={segment.category}
                cx={100}
                cy={100}
                r={radius}
                fill="none"
                stroke={segment.color}
                strokeWidth={strokeWidth}
                strokeDasharray={segment.strokeDasharray}
                strokeDashoffset={segment.strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-500 ease-out opacity-95 hover:opacity-100"
              />
            ))}
          </svg>

          {/* Center Metric */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight leading-none">
              {totalUnits}
            </span>
            <span className="text-[11px] uppercase tracking-wider font-semibold text-emerald-600 mt-1.5">
              Units Sold
            </span>
          </div>
        </div>

        {/* Scaled Category Legend Items */}
        <div className="flex flex-col gap-3">
          {categories.map((item) => (
            <div
              key={item.category}
              className="flex flex-col gap-2 p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/60 hover:bg-slate-50 hover:border-slate-300 transition-all"
            >
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0 shadow-xs"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="font-semibold text-sm text-slate-800">{item.category}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-slate-500 text-xs">{item.units} pcs</span>
                  <span
                    className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-full text-slate-700 bg-white border border-slate-200 shadow-xs"
                  >
                    {item.percentage}%
                  </span>
                </div>
              </div>

              {/* Smooth Progress Bar */}
              <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${item.percentage}%`,
                    backgroundColor: item.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
      )}
      </div>
    </div>
  );
}
