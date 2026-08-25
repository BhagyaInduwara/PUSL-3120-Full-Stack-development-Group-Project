import { Card } from "./Card";
import { Button } from "./Button";

interface PendingMoveBannerProps {
  label: string;
  fromStatus: string;
  toStatus: string;
  onSave: () => void;
  onUndo: () => void;
}

/**
 * PendingMoveBanner — confirmation bar shown after dragging a Kanban card
 * (Sales orders, Production jobs) to a new column. Nothing is persisted
 * until Save is clicked (which also dismisses the banner and makes the
 * move final — there's no undo after that); Undo snaps the card back to
 * its original column with no backend call ever made.
 */
export function PendingMoveBanner({ label, fromStatus, toStatus, onSave, onUndo }: PendingMoveBannerProps) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-20">
      <Card elevation="lg" className="px-4 py-3">
        <div className="flex items-center gap-4">
          <span className="text-sm">
            Move <span className="font-semibold">{label}</span> from{" "}
            <span className="font-semibold">{fromStatus}</span> to <span className="font-semibold">{toStatus}</span>?
            <span className="block text-xs text-[var(--color-neutral-500)] mt-0.5">
              This can&apos;t be undone once saved.
            </span>
          </span>
          <div className="flex gap-2 flex-none">
            <Button variant="secondary" onClick={onUndo}>
              Undo
            </Button>
            <Button variant="primary" onClick={onSave}>
              Save
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
