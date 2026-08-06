import type { Invoice } from "@/domain/Invoice";
import type { Order } from "@/domain/Order";
import { Card } from "@/components/ui/Card";
import { StatusTag } from "@/components/ui/Tag";
import { Button } from "@/components/ui/Button";

interface InvoiceDetailProps {
  invoice: Invoice;
  order: Order | undefined;
  onMarkPaid: () => void;
}

/** InvoiceDetail — single-invoice view rendered at /invoicing/[invoiceId]. Line item and totals come from the linked Order (an Invoice has no priced line of its own). */
export function InvoiceDetail({ invoice, order, onMarkPaid }: InvoiceDetailProps) {
  return (
    <Card elevation="sm" className="max-w-[760px] gap-5 p-7">
      <div className="flex justify-between items-start">
        <div>
          <div className="font-[family-name:var(--font-heading)] text-2xl font-medium">{invoice.id}</div>
          <div className="text-[13px] text-[var(--color-neutral-500)] mt-0.5">
            Linked order <span className="text-[var(--color-accent)]">{invoice.orderId}</span>
          </div>
        </div>
        <StatusTag entity={invoice} />
      </div>

      <div className="grid grid-cols-3 gap-4 py-4 border-t border-b border-[var(--color-divider)]">
        <div>
          <div className="text-[11px] text-[var(--color-neutral-500)] mb-[3px]">Bill to</div>
          <div className="text-sm">{order?.customer ?? "—"}</div>
        </div>
        <div>
          <div className="text-[11px] text-[var(--color-neutral-500)] mb-[3px]">Issue date</div>
          <div className="text-sm">{invoice.issueDate}</div>
        </div>
        <div>
          <div className="text-[11px] text-[var(--color-neutral-500)] mb-[3px]">Due date</div>
          <div className="text-sm">{invoice.dueDate}</div>
        </div>
      </div>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-[var(--color-divider)]">
            {["Item", "Qty", "Unit price", "Amount"].map((h) => (
              <th key={h} className="text-left text-[11px] tracking-[0.08em] uppercase text-[var(--color-neutral-500)] p-2 font-normal">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="p-2">{order?.product ?? "—"}</td>
            <td className="p-2">{order?.qty ?? "—"}</td>
            <td className="p-2">{order?.priceFormatted ?? "—"}</td>
            <td className="p-2">{order?.amountFormatted ?? "—"}</td>
          </tr>
        </tbody>
      </table>

      <div className="flex flex-col gap-1.5 self-end w-[240px]">
        <div className="flex justify-between text-[13px] text-[var(--color-neutral-500)]">
          <span>Subtotal</span>
          <span>{order?.amountFormatted ?? "—"}</span>
        </div>
        <div className="flex justify-between text-[13px] text-[var(--color-neutral-500)]">
          <span>Shipping</span>
          <span>$0.00</span>
        </div>
        <div className="flex justify-between text-base font-semibold pt-2 border-t border-[var(--color-divider)]">
          <span>Total</span>
          <span>{order?.amountFormatted ?? "—"}</span>
        </div>
      </div>

      <div className="flex gap-2.5">
        <Button variant="primary" onClick={onMarkPaid} disabled={invoice.status === "Paid"}>
          Mark as paid
        </Button>
        <Button variant="secondary">Send reminder</Button>
        <Button variant="ghost">Download PDF</Button>
      </div>
    </Card>
  );
}
