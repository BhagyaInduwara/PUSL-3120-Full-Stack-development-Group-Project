"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { JobColumn } from "@/components/production/JobColumn";
import { JobDetailDialog } from "@/components/production/JobDetailDialog";
import { NewJobModal } from "@/components/production/NewJobModal";
import { ProductionJob, type JobStatus } from "@/domain/ProductionJob";

import { API_URL } from "@/lib/apiUrl";

interface ApiProductionJob {
  _id: string;
  number: string;
  product: string;
  qty: number;
  due: string;
  status: JobStatus;
  progress?: number;
}

function formatDue(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function toProductionJob(job: ApiProductionJob): ProductionJob {
  return new ProductionJob({
    id: job._id,
    number: job.number,
    product: job.product,
    qty: job.qty,
    due: formatDue(job.due),
    status: job.status,
    progress: job.progress,
  });
}

/** Pure fetch, no setState — kept separate so the initial-load effect can set state inline (the pattern its lint rule expects) while mutation handlers reuse the same fetch logic outside any effect. */
async function fetchJobs(): Promise<ProductionJob[]> {
  const response = await fetch(`${API_URL}/api/production-jobs`, { credentials: "include" });
  if (!response.ok) return [];
  const data = await response.json();
  return (data.productionJobs as ApiProductionJob[]).map(toProductionJob);
}

export default function ProductionPage() {
  const [jobs, setJobs] = useState<ProductionJob[]>([]);
  const [selectedJob, setSelectedJob] = useState<ProductionJob | null>(null);
  const [isNewJobOpen, setIsNewJobOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setJobs(await fetchJobs());
      } catch (error) {
        console.error("Error fetching production jobs:", error);
      }
    })();
  }, []);

  async function handleSaveJob(patch: Partial<{ product: string; qty: number; due: string }>) {
    if (!selectedJob) return;
    try {
      await fetch(`${API_URL}/api/production-jobs/${selectedJob.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        // The update endpoint replaces product/qty/due/status/progress together,
        // so unchanged fields are sent as-is rather than left undefined.
        body: JSON.stringify({
          product: patch.product ?? selectedJob.product,
          qty: patch.qty ?? selectedJob.qty,
          due: patch.due ?? selectedJob.due,
          status: selectedJob.status,
          progress: selectedJob.progress,
        }),
      });
      setSelectedJob(null);
      setJobs(await fetchJobs());
    } catch (error) {
      console.error("Error saving job:", error);
    }
  }

  async function handleCreateJob(data: { product: string; qty: number; due: string }) {
    try {
      await fetch(`${API_URL}/api/production-jobs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ product: data.product, qty: data.qty, due: data.due }),
      });
      setIsNewJobOpen(false);
      setJobs(await fetchJobs());
    } catch (error) {
      console.error("Error creating job:", error);
    }
  }

  return (
    <>
      <PageHeader
        title="Production Jobs"
        subtitle="Manage active and completed production runs."
        actions={
          <Button variant="secondary" onClick={() => setIsNewJobOpen(true)}>
            Create New Job
          </Button>
        }
      />
      <div className="flex-1 overflow-auto px-8 pt-6 pb-10">
        <div className="grid grid-cols-3 gap-4">
          <JobColumn
            label="Planned"
            jobs={jobs.filter((j) => j.status === "Planned")}
            variant="neutral"
            onSelect={setSelectedJob}
          />
          <JobColumn
            label="In Progress"
            jobs={jobs.filter((j) => j.status === "In Progress")}
            variant="accent"
            onSelect={setSelectedJob}
          />
          <JobColumn
            label="Completed"
            jobs={jobs.filter((j) => j.status === "Completed")}
            variant="neutral"
            dim
            onSelect={setSelectedJob}
          />
        </div>
      </div>

      {selectedJob && (
        <JobDetailDialog job={selectedJob} onClose={() => setSelectedJob(null)} onSave={handleSaveJob} />
      )}

      {isNewJobOpen && <NewJobModal onClose={() => setIsNewJobOpen(false)} onSubmit={handleCreateJob} />}
    </>
  );
}
