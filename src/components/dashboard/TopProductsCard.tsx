import { CardTitle } from "@/components/ui/Card";

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
    <div className="bg-white rounded-2xl p-7 border border-slate-200/80 shadow-xs flex flex-col justify-between min-h-[460px] gap-6">
      <div>
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div>
            <CardTitle className="text-lg">Top Performing Products</CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">
              Ranked by total sales volume &amp; revenue
            </p>
          </div>
          <span className="text-[11px] text-slate-500 font-medium bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200/60 shadow-xs">
            Top {displayedProducts.length} Items
          </span>
        </div>

        <div className="flex flex-col gap-3">
          {displayedProducts.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
              No sales activity recorded yet.
            </div>
          ) : (
            displayedProducts.map((item) => {
              const fillPercentage = Math.round((item.units / maxUnits) * 100);

              return (
                <div
                  key={item.name}
                  className="flex flex-col gap-2.5 p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/60 hover:border-slate-300 hover:bg-slate-50 transition-all"
                >
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-5 text-center font-mono text-[11px] font-semibold text-emerald-600 bg-emerald-50 rounded py-0.5 flex-shrink-0">
                        #{item.rank}
                      </span>

                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-slate-900 font-medium text-xs truncate">
                          {item.name}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white text-slate-500 border border-slate-200 font-normal flex-shrink-0">
                          {item.category}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 flex-shrink-0">
                      <div className="flex items-center gap-1.5 text-[11px]">
                        {item.isLowStock ? (
                          <>
                            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block flex-shrink-0" />
                            <span className="text-amber-700 font-medium">
                              Low Stock ({item.stockQty})
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block flex-shrink-0" />
                            <span className="text-emerald-700 font-medium">
                              In Stock ({item.stockQty})
                            </span>
                          </>
                        )}
                      </div>

                      <div className="text-right font-mono text-[11px] text-slate-700">
                        <span className="font-semibold">{item.units} pcs</span>
                        <span className="text-slate-400 ml-2">({item.revenueFormatted})</span>
                      </div>
                    </div>
                  </div>

                  <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                      style={{ width: `${fillPercentage}%` }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
