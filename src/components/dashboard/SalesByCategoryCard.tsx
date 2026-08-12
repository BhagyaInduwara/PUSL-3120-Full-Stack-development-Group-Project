import { Card, CardTitle } from "@/components/ui/Card";

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
  const radius = 68;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius;

  // Calculate cumulative offsets for SVG stroke-dashoffset with subtle gap
  let cumulativePercentage = 0;
  const segments = categories.map((item) => {
    const strokeDasharray = `${(item.percentage / 100) * circumference} ${circumference}`;
    const strokeDashoffset = -((cumulativePercentage / 100) * circumference);
    cumulativePercentage += item.percentage;
    return {
      ...item,
      strokeDasharray,
      strokeDashoffset,
    };
  });

  return (
    <Card elevation="sm" className="gap-6 p-6">
      <div className="flex items-center justify-between pb-3 border-b border-[var(--color-divider)]">
        <div>
          <CardTitle>Sales by Category</CardTitle>
          <p className="text-xs text-[var(--color-neutral-500)] mt-0.5">
            Product sales volume distribution across categories
          </p>
        </div>
        <span className="text-[11px] text-[var(--color-neutral-500)] font-normal">
          Total: {totalUnits} units
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] items-center gap-8 pt-1">
        {/* SVG Donut Chart */}
        <div className="relative flex justify-center items-center py-2">
          <svg viewBox="0 0 180 180" width={180} height={180} className="-rotate-90 transform">
            {/* Dark Ring Track */}
            <circle
              cx={90}
              cy={90}
              r={radius}
              fill="none"
              stroke="#2a2d3d"
              strokeWidth={strokeWidth}
            />
            {/* Colored Segments */}
            {segments.map((segment) => (
              <circle
                key={segment.category}
                cx={90}
                cy={90}
                r={radius}
                fill="none"
                stroke={segment.color}
                strokeWidth={strokeWidth}
                strokeDasharray={segment.strokeDasharray}
                strokeDashoffset={segment.strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-700 ease-out opacity-95 hover:opacity-100"
              />
            ))}
          </svg>

          {/* Center Metric */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-2xl font-bold text-[var(--color-neutral-100)] tracking-tight leading-none">
              {totalUnits}
            </span>
            <span className="text-[10px] uppercase tracking-widest font-medium text-[var(--color-neutral-500)] mt-1.5">
              Units Sold
            </span>
          </div>
        </div>

        {/* Category Legend */}
        <div className="flex flex-col gap-3">
          {categories.map((item) => (
            <div
              key={item.category}
              className="flex flex-col gap-1.5 p-3 rounded-lg bg-[var(--color-surface-hover)]/30 border border-[var(--color-divider)] transition-all hover:bg-[var(--color-surface-hover)]"
            >
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-[var(--color-neutral-300)] font-normal text-xs">
                    {item.category}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[var(--color-neutral-500)] font-mono text-[11px]">
                    {item.units} pcs
                  </span>
                  <span
                    className="px-2 py-0.5 rounded text-[11px] font-medium border"
                    style={{
                      backgroundColor: item.color + "1f",
                      borderColor: item.color + "44",
                      color: item.color,
                    }}
                  >
                    {item.percentage}%
                  </span>
                </div>
              </div>

              {/* Smooth Progress Bar */}
              <div className="w-full h-1.5 rounded-full bg-[#2a2d3d] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
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
    </Card>
  );
}
