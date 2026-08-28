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

/** Shorten a full record number to its compact segment, e.g. "ORD-2026/08/22/A014" → "A014"
 *  so the badge stays readable at small sizes. The full number is preserved in the title tooltip. */
function shortId(recordNumber: string): string {
  const parts = recordNumber.split("/");
  return parts[parts.length - 1] ?? recordNumber;
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
      {/* Column header */}
      <div className={`flex items-center justify-between mb-3 ${dim ? "opacity-60" : ""}`}>
        <span className="text-xs font-semibold tracking-wide uppercase text-[var(--color-neutral-400)]">{label}</span>
        <Tag variant={variant}>{columnJobs.length}</Tag>
      </div>

      {/* Job cards */}
      <div className="flex flex-col gap-3">
        {columnJobs.map((job) => {
          const pending = pendingMove?.jobId === job.id;
          const effectiveStatus = displayStatus(job, pendingMove);
          return (
            <Card
              key={job.id}
              draggable
              onDragStart={(e) => e.dataTransfer.setData("text/plain", job.id)}
              elevation="sm"
              className={`gap-0 cursor-grab active:cursor-grabbing select-none transition-shadow ${dim ? "opacity-70" : ""} ${
                pending ? "border border-dashed border-[var(--color-accent)]" : ""
              }`}
              onClick={() => onSelect(job)}
            >
              {/* Top row: job number + linked order badge */}
              <div className="flex justify-between items-center mb-2.5">
                <span className="text-[10px] font-mono text-[var(--color-neutral-500)]">{job.number}</span>
                {job.orderNumber ? (
                  <span title={job.orderNumber}>
                    <Tag
                      variant="accent"
                      className="text-[10px] px-2 py-[2px] font-semibold tracking-wide"
                    >
                      {shortId(job.orderNumber)}
                    </Tag>
                  </span>
                ) : (
                  <Tag variant="neutral" className="text-[10px] px-2 py-[2px] opacity-60">
                    Stock
                  </Tag>
                )}
              </div>

              {/* Product name + customer */}
              <div className="mb-3">
                <div className="text-[13px] font-semibold leading-snug text-[var(--color-text)]">{job.product}</div>
                {job.customer && (
                  <div className="text-[11px] text-[var(--color-neutral-300)] mt-0.5 truncate">{job.customer}</div>
                )}
              </div>

              {/* Progress bar — only for In Progress */}
              {effectiveStatus === "In Progress" && (
                <div className="mb-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-medium text-[var(--color-neutral-400)]">Progress</span>
                    <span className="text-[10px] font-semibold text-[var(--color-accent)]">{job.progress}%</span>
                  </div>
                  <div className="w-full h-[5px] rounded-full bg-[var(--color-neutral-800)] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[var(--color-accent)] transition-all duration-500"
                      style={{ width: `${job.progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Footer: qty + due */}
              <div className="flex justify-between items-center pt-2.5 border-t border-[var(--color-divider)]">
                <span className="text-[11px] font-medium text-[var(--color-neutral-300)]">
                  Qty <span className="font-semibold text-[var(--color-text)]">{job.qty}</span>
                </span>
                <span className="text-[11px] text-[var(--color-neutral-400)]">Due {job.due}</span>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
