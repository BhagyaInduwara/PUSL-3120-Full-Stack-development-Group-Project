"use client";

import { useERPStore } from "@/store/useERPStore";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { JobColumn } from "@/components/production/JobColumn";

export default function ProductionPage() {
  const store = useERPStore();

  return (
    <>
      <PageHeader
        title="Production Planning"
        subtitle="Jobs on the floor and what's queued next."
        actions={<Button variant="primary">New Job</Button>}
      />
      <div className="flex-1 overflow-auto px-8 pt-6 pb-10">
        <div className="grid grid-cols-3 gap-4">
          <JobColumn label="Planned" jobs={store.jobsByStatus("Planned")} variant="neutral" />
          <JobColumn label="In Progress" jobs={store.jobsByStatus("In Progress")} variant="accent" />
          <JobColumn label="Completed" jobs={store.jobsByStatus("Completed")} variant="neutral" dim />
        </div>
      </div>
    </>
  );
}
