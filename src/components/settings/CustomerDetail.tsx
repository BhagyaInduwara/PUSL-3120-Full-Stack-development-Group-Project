"use client";

import { useERPStore } from "@/store/useERPStore";
import { Card, CardKicker, CardTitle } from "@/components/ui/Card";
import { Table, type Column } from "@/components/ui/Table";
import { StatusTag } from "@/components/ui/Tag";
import { LinkButton } from "@/components/ui/Button";
import { CustomerTagBadges } from "./CustomerTagBadges";
import { Money } from "@/domain/Money";
import type { Order } from "@/domain/Order";
import type { Customer } from "@/domain/Customer";

/* ------------------------------------------------------------------ */
/*  Order table columns — reuses the same Column<Order> pattern        */
/*  used across Sales, Invoicing pages.                                */
/* ------------------------------------------------------------------ */
const orderColumns: Column<Order>[] = [
  {
    header: "Order ID",
    cell: (o) => <span className="font-semibold text-[var(--color-accent)]">{o.id}</span>,
  },
  {
    header: "Product",
    cell: (o) => o.product,
  },
  {
    header: "Qty",
    cell: (o) => o.qty,
    className: "text-right",
  },
  {
    header: "Unit Price",
    cell: (o) => o.priceFormatted,
    className: "text-right text-[var(--color-neutral-500)]",
  },
  {
    header: "Amount",
    cell: (o) => o.amountFormatted,
    className: "text-right font-semibold",
  },
  {
    header: "Status",
    cell: (o) => <StatusTag entity={o} />,
  },
  {
    header: "Date",
    cell: (o) => o.date,
    className: "text-[var(--color-neutral-500)]",
  },
];

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */
interface CustomerDetailProps {
  customer: Customer;
}

export function CustomerDetail({ customer }: CustomerDetailProps) {
  const store = useERPStore();
  const orders = store.ordersByCustomer(customer.name);

  // Calculate total revenue from all orders for this customer
  const totalRevenue = orders.reduce(
    (sum, o) => sum.add(o.amount),
    Money.zero(),
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Back link */}
      <div>
        <LinkButton href="/settings/customers" variant="ghost">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="opacity-70">
            <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to Customers
        </LinkButton>
      </div>

      {/* ---- Customer header card ---- */}
      <Card elevation="md" className="relative overflow-hidden">
        {/* Subtle purple glow accent on top edge */}
        <div
          className="absolute top-0 left-0 right-0 h-[2px]"
          style={{ background: "linear-gradient(90deg, var(--color-accent-700), var(--color-accent-400), var(--color-accent-700))" }}
        />
        <div className="flex items-start justify-between gap-6 pt-2">
          <div className="flex-1 min-w-0">
            <h4 className="m-0 mb-1 text-[22px]">{customer.name}</h4>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-[13px] mt-2">
              {/* Contact */}
              <span className="flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-[var(--color-accent)] flex-shrink-0">
                  <path d="M8 8a3 3 0 100-6 3 3 0 000 6zM2 14c0-2.21 2.69-4 6-4s6 1.79 6 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                </svg>
                <span className="text-[var(--color-neutral-300)]">{customer.contact}</span>
              </span>

              {/* Email */}
              <span className="flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-[var(--color-accent)] flex-shrink-0">
                  <rect x="2" y="3.5" width="12" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
                  <path d="M2 5l6 4 6-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                </svg>
                <a href={`mailto:${customer.email}`} className="text-[var(--color-accent)] no-underline hover:underline">
                  {customer.email}
                </a>
              </span>

              {/* City */}
              <span className="flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-[var(--color-accent)] flex-shrink-0">
                  <path d="M8 14s-5-4.58-5-7.5a5 5 0 1110 0C13 9.42 8 14 8 14z" stroke="currentColor" strokeWidth="1.3" />
                  <circle cx="8" cy="6.5" r="1.5" stroke="currentColor" strokeWidth="1.3" />
                </svg>
                <span className="text-[var(--color-neutral-300)]">{customer.city}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Tags section */}
        <div className="mt-4 pt-3 border-t border-[var(--color-divider)]">
          <div className="text-[11px] tracking-[0.08em] uppercase text-[var(--color-neutral-500)] mb-2">Tags</div>
          <CustomerTagBadges />
        </div>
      </Card>

      {/* ---- Stats row ---- */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Revenue */}
        <Card elevation="sm" className="relative overflow-hidden">
          <div
            className="absolute top-0 left-0 right-0 h-[2px]"
            style={{ background: "linear-gradient(90deg, transparent, var(--color-accent-600), transparent)" }}
          />
          <CardKicker>Total Revenue</CardKicker>
          <CardTitle className="text-[26px] mt-1">{totalRevenue.format()}</CardTitle>
          <span className="text-[12px] text-[var(--color-neutral-500)]">
            across {orders.length} order{orders.length !== 1 ? "s" : ""}
          </span>
        </Card>

        {/* Active orders */}
        <Card elevation="sm" className="relative overflow-hidden">
          <div
            className="absolute top-0 left-0 right-0 h-[2px]"
            style={{ background: "linear-gradient(90deg, transparent, var(--color-accent-2-600), transparent)" }}
          />
          <CardKicker>Active Orders</CardKicker>
          <CardTitle className="text-[26px] mt-1">
            {orders.filter((o) => o.status !== "Closed").length}
          </CardTitle>
          <span className="text-[12px] text-[var(--color-neutral-500)]">
            not yet closed
          </span>
        </Card>

        {/* Average order value */}
        <Card elevation="sm" className="relative overflow-hidden">
          <div
            className="absolute top-0 left-0 right-0 h-[2px]"
            style={{ background: "linear-gradient(90deg, transparent, var(--color-neutral-600), transparent)" }}
          />
          <CardKicker>Avg. Order Value</CardKicker>
          <CardTitle className="text-[26px] mt-1">
            {orders.length > 0
              ? Money.fromCents(
                  Math.round(totalRevenue.dollars * 100 / orders.length),
                ).format()
              : "$0"}
          </CardTitle>
          <span className="text-[12px] text-[var(--color-neutral-500)]">
            per order
          </span>
        </Card>
      </div>

      {/* ---- Order history table ---- */}
      <div>
        <h5 className="m-0 mb-3">Order History</h5>
        {orders.length > 0 ? (
          <Table columns={orderColumns} rows={orders} rowKey={(o) => o.id} />
        ) : (
          <Card elevation="sm">
            <p className="text-center text-[var(--color-neutral-500)] text-[13px] py-6 m-0">
              No orders found for this customer.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
