"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardTitle } from "@/components/ui/Card";
import { Tag } from "@/components/ui/Tag";
import { StatCard } from "@/components/dashboard/StatCard";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { SalesByCategoryCard, type CategorySalesItem } from "@/components/dashboard/SalesByCategoryCard";
import { TopProductsCard, type TopProductItem } from "@/components/dashboard/TopProductsCard";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { ACTIVITY_FEED_SEED, REVENUE_SERIES_SEED } from "@/repositories/seed-data";
import { PendingOrdersIcon, ProductionIcon, ShipmentIcon, LowStockIcon } from "@/components/icons";
import { Order, type OrderStatus, type OrderLineItem } from "@/domain/Order";
import { ProductionJob, type JobStatus } from "@/domain/ProductionJob";
import { InventoryItem } from "@/domain/InventoryItem";
import { Money } from "@/domain/Money";

import { API_URL } from "@/lib/apiUrl";

const CATEGORY_COLORS: Record<string, string> = {
  Seating: "#818cf8",
  Storage: "#38bdf8",
  Desks: "#34d399",
  Tables: "#f472b6",
};

interface ApiOrder {
  _id: string;
  number: string;
  customer: string;
  lineItems: OrderLineItem[];
  status: OrderStatus;
  date: string;
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

function toOrder(o: ApiOrder): Order {
  return new Order({
    id: o._id,
    number: o.number,
    customer: o.customer,
    lineItems: o.lineItems,
    status: o.status,
    date: new Date(o.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
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
}

const EMPTY_DATA: DashboardData = { orders: [], jobs: [], shipments: [], inventory: [], products: [] };

async function fetchDashboardData(): Promise<DashboardData> {
  const [ordersRes, jobsRes, shipmentsRes, inventoryRes, productsRes] = await Promise.all([
    fetch(`${API_URL}/api/orders`, { credentials: "include" }),
    fetch(`${API_URL}/api/production-jobs`, { credentials: "include" }),
    fetch(`${API_URL}/api/shipments`, { credentials: "include" }),
    fetch(`${API_URL}/api/inventory`, { credentials: "include" }),
    fetch(`${API_URL}/api/products`, { credentials: "include" }),
  ]);

  const orders = ordersRes.ok ? ((await ordersRes.json()) as ApiOrder[]).map(toOrder) : [];
  const jobs = jobsRes.ok ? ((await jobsRes.json()).productionJobs as ApiProductionJob[]).map(toJob) : [];
  const shipments = shipmentsRes.ok ? ((await shipmentsRes.json()).shipments as ApiShipment[]) : [];
  const apiInventory = inventoryRes.ok ? ((await inventoryRes.json()).inventory as ApiInventoryItem[]) : [];
  const inventory = apiInventory.map((i) => new InventoryItem(i));
  const products = productsRes.ok ? ((await productsRes.json()).products as ApiProduct[]) : [];

  return { orders, jobs, shipments, inventory, products };
}

const today = new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData>(EMPTY_DATA);

  useEffect(() => {
    (async () => {
      try {
        setData(await fetchDashboardData());
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    })();
  }, []);

  const { orders, jobs, shipments, inventory, products } = data;

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

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Welcome back — here's what's moving today."
        actions={<Tag variant="neutral">{today}</Tag>}
      />
      <div className="flex-1 overflow-auto px-8 pt-6 pb-10">
        <div className="grid grid-cols-4 gap-4 mb-6">
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
            valueClassName="text-[var(--color-accent-300)]"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-6 items-start">
          <div className="flex flex-col gap-6">
            <Card elevation="sm" className="gap-3 p-6">
              <div className="flex items-baseline justify-between">
                <div>
                  <CardTitle>Orders &amp; revenue</CardTitle>
                  <p className="text-xs text-[var(--color-neutral-500)] mt-0.5">Weekly revenue &amp; order volume performance</p>
                </div>
                <span className="text-[11px] text-[var(--color-neutral-500)]">Last 8 weeks</span>
              </div>
              <RevenueChart series={REVENUE_SERIES_SEED} />
              <div className="flex gap-6 text-xs text-[var(--color-neutral-400)] pt-2 border-t border-[var(--color-divider)]">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[var(--color-accent-800)] inline-block" />
                  Revenue ($)
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-4 h-0.5 bg-[var(--color-accent)] inline-block" />
                  Orders Placed
                </span>
              </div>
            </Card>

            <SalesByCategoryCard categories={salesByCategory} totalUnits={totalSalesUnits} />
          </div>

          <div className="flex flex-col gap-6">
            <TopProductsCard products={topProducts} limit={5} />

            <Card elevation="sm" className="gap-0.5 p-6">
              <ActivityFeed items={ACTIVITY_FEED_SEED} />
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
