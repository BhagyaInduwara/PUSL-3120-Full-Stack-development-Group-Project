"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardKicker } from "@/components/ui/Card";

const API_URL = "http://localhost:4000";

interface DashboardStats {
  totalInventory: number;
  activeProductionJobs: number;
}

/**
 * Dashboard — there's no single /api/dashboard aggregate endpoint, so stats
 * are derived client-side from the two collection endpoints that do exist
 * (/api/inventory, /api/production-jobs) rather than calling a route that
 * was never registered in server/src/app.ts.
 */
export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({ totalInventory: 0, activeProductionJobs: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [inventoryRes, jobsRes] = await Promise.all([
          fetch(`${API_URL}/api/inventory`, { credentials: "include" }),
          fetch(`${API_URL}/api/production-jobs`, { credentials: "include" }),
        ]);

        const inventoryData = inventoryRes.ok ? await inventoryRes.json() : { inventory: [] };
        const jobsData = jobsRes.ok ? await jobsRes.json() : { productionJobs: [] };

        const activeJobs = (jobsData.productionJobs ?? []).filter(
          (job: { status: string }) => job.status !== "Completed"
        );

        setStats({
          totalInventory: (inventoryData.inventory ?? []).length,
          activeProductionJobs: activeJobs.length,
        });
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Overview of your operations, inventory, and production metrics."
      />
      <div className="flex-1 overflow-auto px-8 pt-6 pb-10">
        {loading ? (
          <p className="text-sm text-[var(--color-neutral-500)]">Loading live metrics…</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card elevation="sm">
              <CardKicker>Total Inventory Items</CardKicker>
              <div className="font-[family-name:var(--font-heading)] text-[30px] font-medium">
                {stats.totalInventory}
              </div>
            </Card>
            <Card elevation="sm">
              <CardKicker>Active Production Jobs</CardKicker>
              <div className="font-[family-name:var(--font-heading)] text-[30px] font-medium">
                {stats.activeProductionJobs}
              </div>
            </Card>
            <Card elevation="sm">
              <CardKicker>System Status</CardKicker>
              <div className="font-[family-name:var(--font-heading)] text-[30px] font-medium text-[var(--color-accent)]">
                Connected
              </div>
            </Card>
          </div>
        )}
      </div>
    </>
  );
}
