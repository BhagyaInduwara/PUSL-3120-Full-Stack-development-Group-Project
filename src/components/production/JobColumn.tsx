import type { ProductionJob } from "@/domain/ProductionJob";
import { Card } from "@/components/ui/Card";
import { Tag } from "@/components/ui/Tag";

interface JobColumnProps {
  label: string;
  jobs: ProductionJob[];
  variant: "neutral" | "accent";
  dim?: boolean;
  onSelect: (job: ProductionJob) => void;
}

/** JobColumn — one of the three Production Planning columns (Planned / In Progress / Completed). */
export function JobColumn({ label, jobs, variant, dim, onSelect }: JobColumnProps) {
  return (
    <div>
      <div className={`flex items-center justify-between mb-2.5 ${dim ? "opacity-60" : ""}`}>
        <span className="text-xs font-semibold">{label}</span>
        <Tag variant={variant}>{jobs.length}</Tag>
      </div>
      <div className="flex flex-col gap-2.5">
        {jobs.map((job) => (
          <Card
            key={job.id}
            elevation="sm"
            className={`gap-2 cursor-pointer ${dim ? "opacity-70" : ""}`}
            onClick={() => onSelect(job)}
          >
            <div className="text-[13px] font-semibold">{job.product}</div>
            <div className="text-xs text-[var(--color-neutral-500)]">
              Qty {job.qty} &middot; Due {job.due}
            </div>
            {job.status === "In Progress" && (
              <div className="w-full h-[5px] rounded-full bg-[var(--color-neutral-800)] overflow-hidden">
                <div className="h-full bg-[var(--color-accent)]" style={{ width: `${job.progress}%` }} />
              </div>
            )}
            <div className="text-[11px] text-[var(--color-neutral-500)]">{job.id}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}
