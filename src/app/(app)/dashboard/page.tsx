"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { CardTitle } from "@/components/ui/Card";
import { Tag } from "@/components/ui/Tag";
import { Skeleton } from "@/components/ui";
import { StatCard } from "@/components/dashboard/StatCard";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { SalesByCategoryCard, type CategorySalesItem } from "@/components/dashboard/SalesByCategoryCard";
import { TopProductsCard, type TopProductItem } from "@/components/dashboard/TopProductsCard";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import type { RevenuePoint } from "@/components/dashboard/RevenueChart";
import type { ActivityItem } from "@/components/dashboard/ActivityFeed";
import { PendingOrdersIcon, ProductionIcon, ShipmentIcon, LowStockIcon } from "@/components/icons";
import { Order, type OrderStatus, type OrderLineItem } from "@/domain/Order";
import { ProductionJob, type JobStatus } from "@/domain/ProductionJob";
import { InventoryItem } from "@/domain/InventoryItem";
import { Money } from "@/domain/Money";

import { API_URL } from "@/lib/apiUrl";
import { fetchWithCache } from "@/lib/offline";

const CATEGORY_COLORS: Record<string, string> = {
  Seating: "#059669",
  Storage: "#0284c7",
  Desks: "#d97706",
  Tables: "#7c3aed",
};

interface ApiOrder {
  _id: string;
  number: string;
  customer: string;
  lineItems: OrderLineItem[];
  status: OrderStatus;
  date: string;
  updatedAt: string;
}

interface ApiProductionJob {
  _id: string;
  number: string;
  product: string;
  qty: number;
  due: string;
  status: JobStatus;
  progress?: number;
}

interface ApiShipment {
  id: string;
  status: string;
}

interface ApiInventoryItem {
  sku: string;
  name: string;
  category: string;
  qty: number;
  reorderPoint: number;
}

interface ApiProduct {
  name: string;
  category: string;
}

interface ApiActivity {
  _id: string;
  message: string;
  occurredAt: string;
}

interface ApiRevenuePoint {
  week: string;
  revenue: number;
  orders: number;
}

function formatActivityTime(dateStr: string): string {
  if (!dateStr) return "Recently";
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? "Recently" : d.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function toOrder(o: ApiOrder): Order {
  return new Order({
    id: o._id,
    number: o.number,
    customer: o.customer,
    lineItems: o.lineItems,
    status: o.status,
    date: new Date(o.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    updatedAt: o.updatedAt,
  });
}

function toJob(j: ApiProductionJob): ProductionJob {
  return new ProductionJob({
    id: j._id,
    number: j.number,
    product: j.product,
    qty: j.qty,
    due: j.due,
    status: j.status,
    progress: j.progress,
  });
}

interface DashboardData {
  orders: Order[];
  jobs: ProductionJob[];
  shipments: ApiShipment[];
  inventory: InventoryItem[];
  products: ApiProduct[];
  activities: ActivityItem[];
  revenueSeries: RevenuePoint[];
}

const EMPTY_DATA: DashboardData = {
  orders: [],
  jobs: [],
  shipments: [],
  inventory: [],
  products: [],
  activities: [],
  revenueSeries: [],
};

async function fetchDashboardData(): Promise<DashboardData> {
  const [ordersRes, jobsRes, shipmentsRes, inventoryRes, productsRes, activityRes, revenueRes] = await Promise.allSettled([
    fetchWithCache<ApiOrder[]>(`${API_URL}/api/orders`),
    fetchWithCache<{ productionJobs: ApiProductionJob[] }>(`${API_URL}/api/production-jobs`),
    fetchWithCache<{ shipments: ApiShipment[] }>(`${API_URL}/api/shipments`),
    fetchWithCache<{ inventory: ApiInventoryItem[] }>(`${API_URL}/api/inventory`),
    fetchWithCache<{ products: ApiProduct[] }>(`${API_URL}/api/products`),
    fetchWithCache<{ activities: ApiActivity[] }>(`${API_URL}/api/activity`),
    fetchWithCache<{ revenueSeries: ApiRevenuePoint[] }>(`${API_URL}/api/revenue-series`),
  ]);

  const orders = ordersRes.status === "fulfilled" && Array.isArray(ordersRes.value.data) ? ordersRes.value.data.map(toOrder) : [];
  const jobs = jobsRes.status === "fulfilled" && Array.isArray(jobsRes.value.data?.productionJobs) ? jobsRes.value.data.productionJobs.map(toJob) : [];
  const shipments = shipmentsRes.status === "fulfilled" && Array.isArray(shipmentsRes.value.data?.shipments) ? shipmentsRes.value.data.shipments : [];
  const apiInventory = inventoryRes.status === "fulfilled" && Array.isArray(inventoryRes.value.data?.inventory) ? inventoryRes.value.data.inventory : [];
  const inventory = apiInventory.map((i) => new InventoryItem(i));
  const products = productsRes.status === "fulfilled" && Array.isArray(productsRes.value.data?.products) ? productsRes.value.data.products : [];

  const rawActivities = activityRes.status === "fulfilled" && Array.isArray(activityRes.value.data?.activities) ? activityRes.value.data.activities : [];
  const activities: ActivityItem[] = rawActivities.map((a) => ({
    text: a.message,
    time: formatActivityTime(a.occurredAt),
  }));

  const rawRevenue = revenueRes.status === "fulfilled" && Array.isArray(revenueRes.value.data?.revenueSeries) ? revenueRes.value.data.revenueSeries : [];
  const revenueSeries: RevenuePoint[] = rawRevenue.map((r) => ({
    week: r.week,
    revenue: r.revenue,
    orders: r.orders,
  }));

  return { orders, jobs, shipments, inventory, products, activities, revenueSeries };
}

const today = new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData>(EMPTY_DATA);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setData(await fetchDashboardData());
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const { orders, jobs, shipments, inventory, products, activities, revenueSeries } = data;

  const pendingOrdersCount = orders.filter((o) => o.status === "Draft" || o.status === "Confirmed").length;
  const inProductionCount = jobs.filter((j) => j.status === "Planned" || j.status === "In Progress").length;
  const shipmentsTodayCount = shipments.filter((s) => s.status === "Packed" || s.status === "Dispatched").length;
  const lowStockCount = inventory.filter((i) => i.isLow).length;

  const totalSalesUnits = orders.reduce((sum, o) => sum + o.totalQty, 0);

  const categoryUnits: Record<string, number> = { Seating: 0, Storage: 0, Desks: 0, Tables: 0 };
  for (const order of orders) {
    for (const li of order.lineItems) {
      const product = products.find((p) => p.name === li.product);
      const category = product?.category ?? "Storage";
      categoryUnits[category] = (categoryUnits[category] ?? 0) + li.qty;
    }
  }
  const categoryTotal = Object.values(categoryUnits).reduce((sum, u) => sum + u, 0) || 1;
  const salesByCategory: CategorySalesItem[] = Object.entries(categoryUnits).map(([category, units]) => ({
    category,
    units,
    percentage: Number(((units / categoryTotal) * 100).toFixed(1)),
    color: CATEGORY_COLORS[category] ?? "#94a3b8",
  }));

  const productStats: Record<string, { units: number; revenue: Money }> = {};
  for (const order of orders) {
    for (const li of order.lineItems) {
      if (!productStats[li.product]) productStats[li.product] = { units: 0, revenue: Money.zero() };
      productStats[li.product].units += li.qty;
      productStats[li.product].revenue = productStats[li.product].revenue.add(new Money(li.qty * li.price));
    }
  }
  const topProducts: TopProductItem[] = Object.entries(productStats)
    .map(([name, stats]) => {
      const product = products.find((p) => p.name === name);
      const inventoryItem = inventory.find((i) => i.name === name);
      return {
        rank: 0,
        name,
        category: product?.category ?? inventoryItem?.category ?? "General",
        units: stats.units,
        revenueFormatted: stats.revenue.format(),
        isLowStock: inventoryItem?.isLow ?? false,
        stockQty: inventoryItem?.qty ?? 0,
      };
    })
    .sort((a, b) => b.units - a.units)
    .map((item, idx) => ({ ...item, rank: idx + 1 }));

  const [activeTab, setActiveTab] = useState<"overview" | "operations">("overview");

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[var(--color-bg)]">
      <PageHeader
        title="Dashboard"
        subtitle="Executive operational overview and live performance metrics."
        actions={<Tag variant="neutral">{today}</Tag>}
      />

      <div className="px-8 bg-[var(--color-surface)] border-b border-[var(--color-divider)] flex items-center justify-between">
        <nav className="flex gap-8 -mb-px">
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={`py-3.5 text-sm font-medium border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "overview"
                ? "border-[var(--color-accent)] text-[var(--color-accent)] font-semibold"
                : "border-transparent text-[var(--color-neutral-400)] hover:text-[var(--color-text)] hover:border-[var(--color-divider)]"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full inline-block transition-colors ${
                activeTab === "overview" ? "bg-[var(--color-accent)] shadow-xs" : "bg-[var(--color-neutral-600)]"
              }`}
            />
            Overview &amp; Cashflow
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("operations")}
            className={`py-3.5 text-sm font-medium border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "operations"
                ? "border-[var(--color-accent)] text-[var(--color-accent)] font-semibold"
                : "border-transparent text-[var(--color-neutral-400)] hover:text-[var(--color-text)] hover:border-[var(--color-divider)]"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full inline-block transition-colors ${
                activeTab === "operations" ? "bg-[var(--color-accent)] shadow-xs" : "bg-[var(--color-neutral-600)]"
              }`}
            />
            Operations &amp; Products
          </button>
        </nav>
        <div className="text-xs text-[var(--color-neutral-400)] font-medium">
          Live sync active
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
        <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-divider)] shadow-xs divide-y divide-[var(--color-divider)] md:divide-y-0 md:divide-x md:divide-[var(--color-divider)] flex flex-col md:flex-row overflow-hidden">
          <StatCard
            kicker="Pending Orders"
            value={pendingOrdersCount}
            description="Awaiting confirmation or invoicing"
            Icon={PendingOrdersIcon}
          />
          <StatCard
            kicker="In Production"
            value={inProductionCount}
            description="Jobs planned or in progress"
            Icon={ProductionIcon}
          />
          <StatCard
            kicker="Shipments Today"
            value={shipmentsTodayCount}
            description="Scheduled for dispatch"
            Icon={ShipmentIcon}
          />
          <StatCard
            kicker="Low Stock Items"
            value={lowStockCount}
            description="Below reorder point"
            Icon={LowStockIcon}
            valueClassName="text-amber-600"
          />
        </div>

        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            <div className="lg:col-span-2 p-7 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-divider)] shadow-xs flex flex-col justify-between min-h-[420px]">
              <div className="flex justify-between items-center mb-4">
                <Skeleton className="h-5 w-36" />
                <Skeleton className="h-5 w-24" />
              </div>
              <Skeleton className="h-[240px] w-full rounded-xl" />
              <div className="flex gap-6 pt-4 border-t border-[var(--color-divider)]">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-28" />
              </div>
            </div>
            <div className="p-7 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-divider)] shadow-xs flex flex-col gap-4 min-h-[420px]">
              <Skeleton className="h-5 w-32" />
              <div className="flex flex-col gap-4 mt-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex justify-between items-center gap-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3.5 w-16" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : activeTab === "overview" ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            <div className="lg:col-span-2 bg-[var(--color-surface)] rounded-2xl p-7 border border-[var(--color-divider)] shadow-xs flex flex-col justify-between min-h-[420px]">
              <div>
                <div className="flex items-baseline justify-between mb-5">
                  <div>
                    <h3 className="text-lg font-semibold text-[var(--color-text)] m-0">Orders &amp; revenue</h3>
                    <p className="text-xs text-[var(--color-neutral-400)] mt-0.5">Weekly revenue &amp; order volume performance</p>
                  </div>
                  <span className="text-xs font-medium text-[var(--color-neutral-400)] bg-[var(--color-surface-subtle)] px-3 py-1.5 rounded-lg border border-[var(--color-divider)] shadow-xs">
                    Last 8 weeks
                  </span>
                </div>
                <div className="py-2">
                  <RevenueChart series={revenueSeries} />
                </div>
              </div>
              <div className="flex gap-8 text-xs text-[var(--color-neutral-400)] pt-5 mt-auto border-t border-[var(--color-divider)] font-medium">
                <span className="flex items-center gap-2.5">
                  <span className="w-3.5 h-3.5 rounded bg-[var(--color-accent)] inline-block" />
                  Revenue ($)
                </span>
                <span className="flex items-center gap-2.5">
                  <span className="w-4 h-1.5 bg-[var(--color-accent-2)] rounded inline-block" />
                  Orders Placed
                </span>
              </div>
            </div>

            <div className="bg-[var(--color-surface)] rounded-2xl p-7 border border-[var(--color-divider)] shadow-xs flex flex-col min-h-[420px]">
              <ActivityFeed items={activities} />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
            <TopProductsCard products={topProducts} limit={5} />
            <SalesByCategoryCard categories={salesByCategory} totalUnits={totalSalesUnits} />
          </div>
        )}
      </div>
    </div>
  );
}
