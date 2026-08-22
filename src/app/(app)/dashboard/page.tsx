"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/PageHeader";

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<any>({});
  const [loading, setLoading] = useState(true);

  // Fetch live metrics from your Express backend when the dashboard loads
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const response = await fetch("http://localhost:4000/api/dashboard", {
          credentials: "include"
        });
        
        if (response.ok) {
          const data = await response.json();
          setDashboardData(data);
        }
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    };

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
          <p>Loading live metrics from database...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-white rounded-lg shadow border border-gray-100">
              <h3 className="text-sm font-medium text-gray-500">Total Inventory Items</h3>
              <p className="text-3xl font-bold mt-2">{dashboardData.totalInventory ?? 0}</p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow border border-gray-100">
              <h3 className="text-sm font-medium text-gray-500">Active Production Jobs</h3>
              <p className="text-3xl font-bold mt-2">{dashboardData.activeProductionJobs ?? 0}</p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow border border-gray-100">
              <h3 className="text-sm font-medium text-gray-500">System Status</h3>
              <p className="text-xl font-semibold text-green-600 mt-2">Connected</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}