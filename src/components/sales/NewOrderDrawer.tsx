import type { IncomingOrderDraft, DraftLineItem } from "@/domain/IncomingOrderDraft";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";
import { CloseIcon, MailParsedIcon } from "@/components/icons";

interface NewOrderDrawerProps {
  draft: IncomingOrderDraft;
  onClose: () => void;
  onLineItemChange: (index: number, patch: Partial<DraftLineItem>) => void;
  onApprove: () => void;
}

/** NewOrderDrawer — slide-over panel for reviewing an order auto-parsed from an inbound email before it becomes a real Order (see IncomingOrderDraft.toOrder). */
export function NewOrderDrawer({ draft, onClose, onLineItemChange, onApprove }: NewOrderDrawerProps) {
  return (
    <>
      <div
        className="absolute inset-0 bg-[color-mix(in_srgb,var(--color-neutral-900)_55%,transparent)]"
        onClick={onClose}
      />
      <Card
        elevation="lg"
        className="absolute top-0 right-0 bottom-0 w-[440px] rounded-none overflow-auto p-6 gap-4"
      >
        <div className="flex justify-between items-start">
          <CardTitle>New Order</CardTitle>
          <Button variant="ghost" icon aria-label="Close" onClick={onClose}>
            <CloseIcon />
          </Button>
        </div>

        <div className="flex gap-2.5 items-start p-3 rounded-lg bg-[var(--color-accent-900)] border border-[var(--color-accent-700)]">
          <MailParsedIcon className="flex-none mt-px" />
          <div className="text-[12.5px] text-[var(--color-accent-100)] leading-relaxed">
            Auto-generated from an inbound email — <strong>awaiting review</strong>. Check quantities and pricing
            before approving.
          </div>
        </div>

        <div className="text-xs text-[var(--color-neutral-500)]">
          Parsed from: <span className="text-[var(--color-text)]">&quot;{draft.emailSubject}&quot;</span>
        </div>

        <Field label="Customer">
          <Input value={draft.customer} readOnly />
        </Field>

        <div>
          <label className="block text-xs mb-1.5 text-[color-mix(in_srgb,var(--color-text)_70%,transparent)]">
            Line items
          </label>
          <div className="flex flex-col gap-2">
            {draft.lineItems.map((li, i) => (
              <div
                key={i}
                className="grid grid-cols-[1fr_56px_76px] gap-2 items-end p-2.5 rounded-lg bg-[var(--color-surface)] border border-[var(--color-divider)]"
              >
                <div className="text-[13px]">{li.product}</div>
                <Input
                  type="number"
                  className="text-center px-1.5 py-1"
                  value={li.qty}
                  onChange={(e) => onLineItemChange(i, { qty: Number(e.target.value) || 0 })}
                />
                <Input
                  type="number"
                  className="text-right px-1.5 py-1"
                  value={li.price}
                  onChange={(e) => onLineItemChange(i, { price: Number(e.target.value) || 0 })}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-between pt-2.5 border-t border-[var(--color-divider)] text-sm">
          <span className="text-[var(--color-neutral-500)]">Estimated total</span>
          <span className="font-[family-name:var(--font-heading)] font-medium text-[17px]">
            {draft.totalFormatted}
          </span>
        </div>

        <div className="flex gap-2.5 mt-1">
          <Button variant="primary" className="flex-1" onClick={onApprove}>
            Approve &amp; create order
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Discard
          </Button>
        </div>
      </Card>
    </>
  );
}
