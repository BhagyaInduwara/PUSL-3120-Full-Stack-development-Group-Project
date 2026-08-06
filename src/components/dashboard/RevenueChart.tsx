export interface RevenuePoint {
  week: string;
  revenue: number;
  orders: number;
}

const TOP_Y = 20;
const BASE_Y = 170;
const BAR_WIDTH = 40;
const STEP = 64;
const START_X = 20;

function scale(value: number, min: number, max: number): number {
  if (max === min) return (TOP_Y + BASE_Y) / 2;
  const t = (value - min) / (max - min);
  return BASE_Y - t * (BASE_Y - TOP_Y);
}

/** RevenueChart — SVG bar (revenue) + line (orders placed) chart, computed from ERPStore.revenueSeries instead of the static path in the original design. */
export function RevenueChart({ series }: { series: RevenuePoint[] }) {
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
    <svg viewBox="0 0 560 200" width="100%" height={200} style={{ overflow: "visible" }}>
      <line x1={0} y1={BASE_Y} x2={540} y2={BASE_Y} stroke="var(--color-divider)" strokeWidth={1} />
      <g fill="var(--color-accent-800)">
        {bars.map((bar) => (
          <rect key={bar.week} x={bar.x} y={bar.y} width={BAR_WIDTH} height={bar.height} rx={3} />
        ))}
      </g>
      {bars[peakIndex] && (
        <rect
          x={bars[peakIndex].x}
          y={bars[peakIndex].y}
          width={BAR_WIDTH}
          height={bars[peakIndex].height}
          rx={3}
          fill="var(--color-accent-600)"
        />
      )}
      <polyline points={linePoints} fill="none" stroke="var(--color-accent)" strokeWidth={2} />
      <g fill="var(--color-accent)">
        {series.map((p, i) => {
          const x = START_X + i * STEP + BAR_WIDTH / 2;
          const y = scale(p.orders, minOrders - 2, maxOrders + 2);
          return <circle key={p.week} cx={x} cy={y} r={3} />;
        })}
      </g>
      <g fill="var(--color-neutral-600)" fontSize={11} fontFamily="var(--font-body)">
        {series.map((p, i) => (
          <text key={p.week} x={START_X + i * STEP + BAR_WIDTH / 2} y={185} textAnchor="middle">
            {p.week}
          </text>
        ))}
      </g>
    </svg>
  );
}
