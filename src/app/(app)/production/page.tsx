"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { JobColumn } from "@/components/production/JobColumn";
import { JobDetailDialog } from "@/components/production/JobDetailDialog";
import { NewJobModal } from "@/components/production/NewJobModal";
import { PendingMoveBanner } from "@/components/ui/PendingMoveBanner";
import { ProductionJob, type JobStatus } from "@/domain/ProductionJob";

import { API_URL } from "@/lib/apiUrl";

interface ApiProductionJob {
  _id: string;
  number: string;
  orderNumber?: string;
  customer?: string;
  product: string;
  qty: number;
  due: string;
  status: JobStatus;
  progress?: number;
}

interface ApiOrder {
  _id: string;
  number: string;
  customer: string;
  lineItems: { product: string; qty: number; price: number }[];
  status: string;
}

function formatDue(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function toProductionJob(job: ApiProductionJob, orders: ApiOrder[] = []): ProductionJob {
  let orderNumber = job.orderNumber;
  let customer = job.customer;

  // Fallback for pre-existing records in MongoDB that don't have orderNumber/customer set
  if (!orderNumber) {
    const matchingOrder = orders.find((o) => o.lineItems.some((li) => li.product === job.product));
    if (matchingOrder) {
      orderNumber = matchingOrder.number;
      customer = customer || matchingOrder.customer;
    }
  }

  return new ProductionJob({
    id: job._id,
    number: job.number,
    orderNumber,
    customer,
    product: job.product,
    qty: job.qty,
    due: formatDue(job.due),
    status: job.status,
    progress: job.progress,
  });
}

/** Pure fetch, no setState — kept separate so the initial-load effect can set state inline (the pattern its lint rule expects) while mutation handlers reuse the same fetch logic outside any effect. */
async function fetchJobs(): Promise<ProductionJob[]> {
  try {
    const [jobsRes, ordersRes] = await Promise.all([
      fetch(`${API_URL}/api/production-jobs`, { credentials: "include" }),
      fetch(`${API_URL}/api/orders`, { credentials: "include" }),
    ]);

    if (!jobsRes.ok) return [];
    const data = await jobsRes.json();
    const orders = ordersRes.ok ? ((await ordersRes.json()) as ApiOrder[]) : [];

    return (data.productionJobs as ApiProductionJob[]).map((j) => toProductionJob(j, orders));
  } catch (error) {
    console.error("Error fetching jobs and orders:", error);
    return [];
  }
}

export default function ProductionPage() {
  const [jobs, setJobs] = useState<ProductionJob[]>([]);
  const [selectedJob, setSelectedJob] = useState<ProductionJob | null>(null);
  const [isNewJobOpen, setIsNewJobOpen] = useState(false);
  const [pendingMove, setPendingMove] = useState<{ jobId: string; fromStatus: JobStatus; toStatus: JobStatus } | null>(
    null
  );

  useEffect(() => {
    (async () => {
      try {
        setJobs(await fetchJobs());
      } catch (error) {
        console.error("Error fetching production jobs:", error);
      }
    })();
  }, []);

  async function handleSaveJob(patch: Partial<{ product: string; qty: number; due: string; orderNumber?: string; customer?: string; progress?: number }>) {
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
          orderNumber: patch.orderNumber ?? selectedJob.orderNumber,
          customer: patch.customer ?? selectedJob.customer,
          status: selectedJob.status,
          progress: patch.progress ?? selectedJob.progress,
        }),
      });
      setSelectedJob(null);
      setJobs(await fetchJobs());
    } catch (error) {
      console.error("Error saving job:", error);
    }
  }

  async function handleCreateJob(data: { product: string; qty: number; due: string; orderNumber?: string; customer?: string }) {
    try {
      await fetch(`${API_URL}/api/production-jobs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          product: data.product,
          qty: data.qty,
          due: data.due,
          orderNumber: data.orderNumber,
          customer: data.customer,
        }),
      });
      setIsNewJobOpen(false);
      setJobs(await fetchJobs());
    } catch (error) {
      console.error("Error creating job:", error);
    }
  }

  /** Dragging a card only stages the move — see PendingMoveBanner. Nothing is sent to the server until handleSaveMove. */
  function handleMove(jobId: string, toStatus: JobStatus) {
    const job = jobs.find((j) => j.id === jobId);
    if (!job) return;

    // Dropped back onto its own real column — same as clicking Undo.
    if (toStatus === job.status) {
      setPendingMove(null);
      return;
    }

    setPendingMove({ jobId, fromStatus: job.status, toStatus });
  }

  function handleUndoMove() {
    setPendingMove(null);
  }

  async function handleSaveMove() {
    if (!pendingMove) return;
    try {
      await fetch(`${API_URL}/api/production-jobs/${pendingMove.jobId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: pendingMove.toStatus }),
      });
      setPendingMove(null);
      setJobs(await fetchJobs());
    } catch (error) {
      console.error("Error updating job status:", error);
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
            status="Planned"
            jobs={jobs}
            variant="neutral"
            pendingMove={pendingMove ? { jobId: pendingMove.jobId, status: pendingMove.toStatus } : null}
            onSelect={setSelectedJob}
            onMove={handleMove}
          />
          <JobColumn
            label="In Progress"
            status="In Progress"
            jobs={jobs}
            variant="accent"
            pendingMove={pendingMove ? { jobId: pendingMove.jobId, status: pendingMove.toStatus } : null}
            onSelect={setSelectedJob}
            onMove={handleMove}
          />
          <JobColumn
            label="Completed"
            status="Completed"
            jobs={jobs}
            variant="neutral"
            dim
            pendingMove={pendingMove ? { jobId: pendingMove.jobId, status: pendingMove.toStatus } : null}
            onSelect={setSelectedJob}
            onMove={handleMove}
          />
        </div>
      </div>

      {selectedJob && (
        <JobDetailDialog job={selectedJob} onClose={() => setSelectedJob(null)} onSave={handleSaveJob} />
      )}

      {isNewJobOpen && <NewJobModal onClose={() => setIsNewJobOpen(false)} onSubmit={handleCreateJob} />}

      {pendingMove &&
        (() => {
          const job = jobs.find((j) => j.id === pendingMove.jobId);
          return job ? (
            <PendingMoveBanner
              label={job.number}
              fromStatus={pendingMove.fromStatus}
              toStatus={pendingMove.toStatus}
              onSave={handleSaveMove}
              onUndo={handleUndoMove}
            />
          ) : null;
        })()}
    </>
  );
}
