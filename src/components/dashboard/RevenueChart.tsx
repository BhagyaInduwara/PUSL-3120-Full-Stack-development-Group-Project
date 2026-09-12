export interface RevenuePoint {
  week: string;
  revenue: number;
  orders: number;
}

const TOP_Y = 25;
const BASE_Y = 220;
const BAR_WIDTH = 46;
const STEP = 68;
const START_X = 24;

function scale(value: number, min: number, max: number): number {
  if (max === min) return (TOP_Y + BASE_Y) / 2;
  const t = (value - min) / (max - min);
  return BASE_Y - t * (BASE_Y - TOP_Y);
}

/** RevenueChart — SVG bar (revenue) + line (orders placed) chart, computed from ERPStore.revenueSeries instead of the static path in the original design. */
export function RevenueChart({ series }: { series: RevenuePoint[] }) {
  if (!series || series.length === 0) {
    return (
      <div className="h-[200px] flex flex-col items-center justify-center border border-dashed border-[var(--color-divider)] rounded-lg text-center p-4 bg-[var(--color-surface)]">
        <p className="text-xs text-[var(--color-neutral-400)] font-medium">No revenue or order history recorded yet</p>
        <p className="text-[11px] text-[var(--color-neutral-500)] mt-1">Data will populate automatically once sales activity begins.</p>
      </div>
    );
  }
  const revenues = series.map((p) => p.revenue);
  const orders = series.map((p) => p.orders);
  const maxRevenue = Math.max(...revenues);
  const maxOrders = Math.max(...orders);
  const minOrders = Math.min(...orders);
  const peakIndex = revenues.indexOf(maxRevenue);

  const bars = series.map((p, i) => {
    const x = START_X + i * STEP;
    const y = scale(p.revenue, 0, maxRevenue * 1.05);
    return { x, y, height: BASE_Y - y, week: p.week };
  });

  const linePoints = series
    .map((p, i) => {
      const x = START_X + i * STEP + BAR_WIDTH / 2;
      const y = scale(p.orders, minOrders - 2, maxOrders + 2);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg viewBox="0 0 580 260" width="100%" height={260} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id="barRegular" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0.05" />
        </linearGradient>
        <linearGradient id="barPeak" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#059669" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0.7" />
        </linearGradient>
      </defs>

      <line x1={0} y1={TOP_Y} x2={560} y2={TOP_Y} stroke="var(--color-divider)" strokeWidth={1} strokeDasharray="3 3" opacity={0.6} />
      <line x1={0} y1={(TOP_Y + BASE_Y) / 2} x2={560} y2={(TOP_Y + BASE_Y) / 2} stroke="var(--color-divider)" strokeWidth={1} strokeDasharray="3 3" opacity={0.6} />
      <line x1={0} y1={BASE_Y} x2={560} y2={BASE_Y} stroke="var(--color-divider)" strokeWidth={1} />

      <g>
        {bars.map((bar, i) => (
          <rect
            key={bar.week}
            x={bar.x}
            y={bar.y}
            width={BAR_WIDTH}
            height={bar.height}
            rx={6}
            fill={i === peakIndex ? "url(#barPeak)" : "url(#barRegular)"}
            stroke={i === peakIndex ? "#059669" : "#a7f3d0"}
            strokeWidth={1}
            className="transition-all duration-150 hover:opacity-85"
          />
        ))}
      </g>

      <polyline points={linePoints} fill="none" stroke="#059669" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      <g>
        {series.map((p, i) => {
          const x = START_X + i * STEP + BAR_WIDTH / 2;
          const y = scale(p.orders, minOrders - 2, maxOrders + 2);
          return (
            <circle
              key={p.week}
              cx={x}
              cy={y}
              r={4}
              fill="#ffffff"
              stroke="#059669"
              strokeWidth={2.5}
              className="transition-transform hover:scale-125 cursor-pointer shadow-xs"
            />
          );
        })}
      </g>
      <g fill="var(--color-neutral-400)" fontSize={12} fontFamily="var(--font-body)">
        {series.map((p, i) => (
          <text key={p.week} x={START_X + i * STEP + BAR_WIDTH / 2} y={242} textAnchor="middle" className="font-semibold">
            {p.week}
          </text>
        ))}
      </g>
    </svg>
  );
}
