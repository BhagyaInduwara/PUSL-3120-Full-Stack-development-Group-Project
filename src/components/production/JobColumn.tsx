import type { DragEvent } from "react";
import type { ProductionJob, JobStatus } from "@/domain/ProductionJob";
import { Card } from "@/components/ui/Card";
import { Tag } from "@/components/ui/Tag";

interface PendingMove {
  jobId: string;
  status: JobStatus;
}

interface JobColumnProps {
  label: string;
  status: JobStatus;
  jobs: ProductionJob[];
  variant: "neutral" | "accent";
  dim?: boolean;
  /** A drag that's moved a card but hasn't been Saved yet — see production/page.tsx. */
  pendingMove: PendingMove | null;
  onSelect: (job: ProductionJob) => void;
  onMove: (jobId: string, status: JobStatus) => void;
}

/** The status a job should render/group under — its pending target if one's in flight, otherwise its real status. */
function displayStatus(job: ProductionJob, pendingMove: PendingMove | null): JobStatus {
  return pendingMove && pendingMove.jobId === job.id ? pendingMove.status : job.status;
}

/** JobColumn — one of the three Production Planning columns (Planned / In Progress / Completed). Drag-and-drop like Sales' OrderBoard: dragging a card only stages the move until confirmed via PendingMoveBanner. */
export function JobColumn({ label, status, jobs, variant, dim, pendingMove, onSelect, onMove }: JobColumnProps) {
  const columnJobs = jobs.filter((j) => displayStatus(j, pendingMove) === status);

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    const jobId = e.dataTransfer.getData("text/plain");
    if (jobId) onMove(jobId, status);
  }

  return (
    <div onDragOver={(e) => e.preventDefault()} onDrop={handleDrop} className="min-h-[120px]">
      <div className={`flex items-center justify-between mb-2.5 ${dim ? "opacity-60" : ""}`}>
        <span className="text-xs font-semibold">{label}</span>
        <Tag variant={variant}>{columnJobs.length}</Tag>
      </div>
      <div className="flex flex-col gap-2.5">
        {columnJobs.map((job) => {
          const pending = pendingMove?.jobId === job.id;
          const effectiveStatus = displayStatus(job, pendingMove);
          return (
            <Card
              key={job.id}
              draggable
              onDragStart={(e) => e.dataTransfer.setData("text/plain", job.id)}
              elevation="sm"
              className={`gap-2 cursor-grab ${dim ? "opacity-70" : ""} ${
                pending ? "border border-dashed border-[var(--color-accent)]" : ""
              }`}
              onClick={() => onSelect(job)}
            >
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-semibold text-[var(--color-neutral-400)]">{job.number}</span>
                {job.orderNumber ? (
                  <Tag variant="accent" className="text-[10px] px-1.5 py-0.5 font-medium">
                    {job.orderNumber}
                  </Tag>
                ) : (
                  <Tag variant="neutral" className="text-[10px] px-1.5 py-0.5">
                    Stock
                  </Tag>
                )}
              </div>

              <div>
                <div className="text-[13px] font-semibold text-[var(--color-text)]">{job.product}</div>
                {job.customer && (
                  <div className="text-xs text-[var(--color-neutral-400)] mt-0.5 truncate">
                    {job.customer}
                  </div>
                )}
              </div>

              <div className="text-xs text-[var(--color-neutral-500)] flex justify-between items-center pt-0.5 border-t border-[var(--color-divider)]">
                <span>Qty {job.qty}</span>
                <span>Due {job.due}</span>
              </div>

              {effectiveStatus === "In Progress" && (
                <div className="w-full h-[5px] rounded-full bg-[var(--color-neutral-800)] overflow-hidden mt-0.5">
                  <div className="h-full bg-[var(--color-accent)]" style={{ width: `${job.progress}%` }} />
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
