import { Card, CardTitle } from "@/components/ui/Card";

export interface TopProductItem {
  rank: number;
  name: string;
  category: string;
  units: number;
  revenueFormatted: string;
  isLowStock: boolean;
  stockQty: number;
}

export interface TopProductsCardProps {
  products: TopProductItem[];
  limit?: number;
}

export function TopProductsCard({ products, limit = 5 }: TopProductsCardProps) {
  const displayedProducts = products.slice(0, limit);
  const maxUnits = displayedProducts[0]?.units || 1;

  return (
    <Card elevation="sm" className="gap-6 p-6">
      <div className="flex items-center justify-between pb-3 border-b border-[var(--color-divider)]">
        <div>
          <CardTitle>Top Performing Products</CardTitle>
          <p className="text-xs text-[var(--color-neutral-500)] mt-0.5">
            Ranked by total sales volume &amp; revenue
          </p>
        </div>
        <span className="text-[11px] text-[var(--color-neutral-500)] font-normal">
          Top {displayedProducts.length} Items
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {displayedProducts.map((item) => {
          const fillPercentage = Math.round((item.units / maxUnits) * 100);

          return (
            <div
              key={item.name}
              className="flex flex-col gap-2.5 p-3.5 rounded-lg bg-[var(--color-surface-hover)]/30 border border-[var(--color-divider)] transition-all hover:bg-[var(--color-surface-hover)]/70"
            >
              <div className="flex items-center justify-between gap-3 text-xs">
                {/* Rank & Product Info */}
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-5 text-center font-mono text-[11px] text-[var(--color-neutral-500)] flex-shrink-0">
                    #{item.rank}
                  </span>

                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-[var(--color-neutral-200)] font-normal text-xs truncate">
                      {item.name}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--color-surface-hover)] text-[var(--color-neutral-400)] border border-[var(--color-divider)] font-normal flex-shrink-0">
                      {item.category}
                    </span>
                  </div>
                </div>

                {/* Crisp Green / Ambient Amber Stock Indicator & Sales Figures */}
                <div className="flex items-center gap-4 flex-shrink-0">
                  {/* Stock Indicator Dot + Text */}
                  <div className="flex items-center gap-1.5 text-[11px]">
                    {item.isLowStock ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-amber-400 inline-block shadow-[0_0_6px_rgba(251,191,36,0.5)] flex-shrink-0" />
                        <span className="text-amber-300 font-medium">
                          Low Stock ({item.stockQty})
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block shadow-[0_0_6px_rgba(52,211,153,0.4)] flex-shrink-0" />
                        <span className="text-emerald-400 font-medium">
                          In Stock ({item.stockQty})
                        </span>
                      </>
                    )}
                  </div>

                  {/* Volume & Revenue */}
                  <div className="text-right font-mono text-[11px] text-[var(--color-neutral-300)]">
                    <span>{item.units} pcs</span>
                    <span className="text-[var(--color-neutral-500)] ml-2">({item.revenueFormatted})</span>
                  </div>
                </div>
              </div>

              {/* Progress Bar (bounded 100% within row padding) */}
              <div className="w-full h-1.5 rounded-full bg-[#2a2d3d] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[var(--color-accent)] transition-all duration-500 opacity-90"
                  style={{ width: `${fillPercentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
