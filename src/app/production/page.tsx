"use client";

import { useState } from "react";
import { useERPStore } from "@/store/useERPStore";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { JobColumn } from "@/components/production/JobColumn";
import { JobDetailDialog } from "@/components/production/JobDetailDialog";
import type { ProductionJob } from "@/domain/ProductionJob";

export default function ProductionPage() {
  const store = useERPStore();
  const [selectedJob, setSelectedJob] = useState<ProductionJob | null>(null);

  return (
    <>
      <PageHeader
        title="Production Planning"
        subtitle="Jobs on the floor and what's queued next."
        actions={<Button variant="primary">New Job</Button>}
      />
      <div className="flex-1 overflow-auto px-8 pt-6 pb-10">
        <div className="grid grid-cols-3 gap-4">
          <JobColumn label="Planned" jobs={store.jobsByStatus("Planned")} variant="neutral" onSelect={setSelectedJob} />
          <JobColumn label="In Progress" jobs={store.jobsByStatus("In Progress")} variant="accent" onSelect={setSelectedJob} />
          <JobColumn label="Completed" jobs={store.jobsByStatus("Completed")} variant="neutral" dim onSelect={setSelectedJob} />
        </div>
      </div>

      {selectedJob && (
        <JobDetailDialog
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
          onSave={(patch) => store.updateJob(selectedJob.id, patch)}
        />
      )}
    </>
  );
}
