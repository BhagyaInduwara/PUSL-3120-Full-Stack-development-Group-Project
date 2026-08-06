"use client";

import { useERPStore } from "@/store/useERPStore";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardTitle } from "@/components/ui/Card";
import { Tag } from "@/components/ui/Tag";
import { StatCard } from "@/components/dashboard/StatCard";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { PendingOrdersIcon, ProductionIcon, ShipmentIcon, LowStockIcon } from "@/components/icons";

const today = new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

export default function DashboardPage() {
  const store = useERPStore();

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
            value={store.pendingOrdersCount}
            description="Awaiting confirmation or invoicing"
            Icon={PendingOrdersIcon}
          />
          <StatCard
            kicker="In Production"
            value={store.inProductionCount}
            description="Jobs planned or in progress"
            Icon={ProductionIcon}
          />
          <StatCard
            kicker="Shipments Today"
            value={store.shipmentsTodayCount}
            description="Scheduled for dispatch"
            Icon={ShipmentIcon}
          />
          <StatCard
            kicker="Low Stock Items"
            value={store.lowStockCount}
            description="Below reorder point"
            Icon={LowStockIcon}
            valueClassName="text-[var(--color-accent-300)]"
          />
        </div>

        <div className="grid grid-cols-[1.5fr_1fr] gap-4">
          <Card elevation="sm" className="gap-3">
            <div className="flex items-baseline justify-between">
              <CardTitle>Orders &amp; revenue</CardTitle>
              <span className="text-[11px] text-[var(--color-neutral-500)]">Last 8 weeks</span>
            </div>
            <RevenueChart series={store.revenueSeries} />
            <div className="flex gap-4 text-xs text-[var(--color-neutral-500)]">
              <span className="flex items-center gap-1.5">
                <span className="w-[9px] h-[9px] rounded-sm bg-[var(--color-accent-800)] inline-block" />
                Revenue
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-0.5 bg-[var(--color-accent)] inline-block" />
                Orders placed
              </span>
            </div>
          </Card>

          <Card elevation="sm" className="gap-0.5">
            <ActivityFeed items={store.activityFeed} />
          </Card>
        </div>
      </div>
    </>
  );
}
