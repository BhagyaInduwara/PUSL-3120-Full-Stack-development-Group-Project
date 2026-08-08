"use client";

import { useState, type ReactNode } from "react";
import { Button } from "./Button";
import { CloseIcon } from "@/components/icons";

interface RecordDialogProps {
  title: string;
  subtitle?: ReactNode;
  statusBadge?: ReactNode;
  /** Whether this record's own status currently allows editing (e.g. entity.canEdit). */
  editable: boolean;
  onClose: () => void;
  /** Commits whatever the edit form has staged. Dialog returns to view mode after. */
  onSave: () => void;
  /** Resets any staged edit-form state. Called when the user cancels out of edit mode. */
  onCancelEdit?: () => void;
  /** Renders the record's fields — read-only rows in "view", inputs in "edit". */
  children: (mode: "view" | "edit") => ReactNode;
}

/**
 * RecordDialog — shared popup shell for viewing (and, when the record's own
 * status allows it, editing) a single Order/Invoice/Shipment/ProductionJob.
 * It only owns the view/edit toggle and the Save/Cancel/Close chrome; the
 * fields themselves come from the caller via `children(mode)` since every
 * entity has different fields. See sales/OrderDetailDialog.tsx for the
 * reference usage, reused the same way for invoicing/shipments/production.
 */
export function RecordDialog({
  title,
  subtitle,
  statusBadge,
  editable,
  onClose,
  onSave,
  onCancelEdit,
  children,
}: RecordDialogProps) {
  const [mode, setMode] = useState<"view" | "edit">("view");

  return (
    <div
      className="fixed inset-0 grid place-items-center p-[var(--space-4)] bg-[color-mix(in_srgb,var(--color-neutral-900)_50%,transparent)]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[560px] max-h-[85vh] overflow-auto flex flex-col gap-4 p-[var(--space-4)] rounded-[var(--radius-lg)] bg-[var(--color-surface)] shadow-[var(--shadow-lg)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start gap-3">
          <div>
            <div className="font-[family-name:var(--font-heading)] font-medium text-xl">{title}</div>
            {subtitle && <div className="text-[13px] text-[var(--color-neutral-500)] mt-0.5">{subtitle}</div>}
          </div>
          <div className="flex items-center gap-2">
            {statusBadge}
            <Button variant="ghost" icon aria-label="Close" onClick={onClose}>
              <CloseIcon />
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-3 text-sm">{children(mode)}</div>

        <div className="flex justify-between items-center gap-2 pt-3 border-t border-[var(--color-divider)]">
          <div>
            {editable && mode === "view" && (
              <Button variant="secondary" onClick={() => setMode("edit")}>
                Edit
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            {mode === "edit" ? (
              <>
                <Button
                  variant="ghost"
                  onClick={() => {
                    onCancelEdit?.();
                    setMode("view");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    onSave();
                    setMode("view");
                  }}
                >
                  Save changes
                </Button>
              </>
            ) : (
              <Button variant="secondary" onClick={onClose}>
                Close
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/** RecordRow — one "label: value" line in a RecordDialog's view mode. */
export function RecordRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex justify-between items-center py-1.5 border-b border-[color-mix(in_srgb,var(--color-text)_8%,transparent)] last:border-b-0">
      <span className="text-[var(--color-neutral-500)]">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
