"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { PlusIcon } from "@/components/icons";
import { Order, type OrderStatus, type OrderLineItem, type OrderEditableFields } from "@/domain/Order";
import { IncomingOrderDraft, type DraftLineItem } from "@/domain/IncomingOrderDraft";
import { ProductionJob, type JobStatus } from "@/domain/ProductionJob";
import { OrderBoard } from "@/components/sales/OrderBoard";
import { OrderTable } from "@/components/sales/OrderTable";
import { NewOrderDrawer } from "@/components/sales/NewOrderDrawer";
import { NewOrderDialog, type NewOrderData } from "@/components/sales/NewOrderDialog";
import { OrderDetailDialog } from "@/components/sales/OrderDetailDialog";
import { PendingMoveBanner } from "@/components/ui/PendingMoveBanner";

import { API_URL } from "@/lib/apiUrl";
import { readCache, writeCache } from "@/lib/offlineCache";
type View = "board" | "table";

const CACHE_KEYS = {
  orders: "sales:orders",
  draft: "sales:draft",
  jobs: "sales:jobs",
} as const;

interface ApiOrder {
  _id: string;
  number: string;
  customer: string;
  lineItems: OrderLineItem[];
  status: OrderStatus;
  date: string;
}

interface ApiDraft {
  _id: string;
  customer: string;
  emailSubject: string;
  lineItems: DraftLineItem[];
}

interface ApiProductionJob {
  _id: string;
  number: string;
  product: string;
  qty: number;
  due: string;
  status: JobStatus;
  progress?: number;
}

function toOrder(o: ApiOrder): Order {
  return new Order({
    id: o._id,
    number: o.number,
    customer: o.customer,
    lineItems: o.lineItems,
    status: o.status,
    date: new Date(o.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
  });
}

function toDraft(d: ApiDraft): IncomingOrderDraft {
  return new IncomingOrderDraft({
    id: d._id,
    customer: d.customer,
    emailSubject: d.emailSubject,
    lineItems: d.lineItems,
  });
}

function toJob(j: ApiProductionJob): ProductionJob {
  return new ProductionJob({
    id: j._id,
    number: j.number,
    product: j.product,
    qty: j.qty,
    due: j.due,
    status: j.status,
    progress: j.progress,
  });
}

/** Every read result says whether it came from the network or a cached snapshot, so the page can show an "offline" indicator. */
interface FetchResult<T> {
  data: T;
  offline: boolean;
  cachedAt?: string;
}

/**
 * Pure fetches, no setState — see production/page.tsx for why
 * (react-hooks/set-state-in-effect). Each caches the raw API response on
 * success and falls back to that cache (see src/lib/offlineCache.ts) if the
 * request fails — a dropped connection, or reloading the page while
 * offline, still shows the last-known board instead of going blank.
 */
async function fetchOrders(): Promise<FetchResult<Order[]>> {
  try {
    const res = await fetch(`${API_URL}/api/orders`, { credentials: "include" });
    if (!res.ok) throw new Error(`GET /api/orders failed: ${res.status}`);
    const raw = (await res.json()) as ApiOrder[];
    writeCache(CACHE_KEYS.orders, raw);
    return { data: raw.map(toOrder), offline: false };
  } catch {
    const cached = readCache<ApiOrder[]>(CACHE_KEYS.orders);
    return { data: (cached?.data ?? []).map(toOrder), offline: true, cachedAt: cached?.cachedAt };
  }
}

async function fetchFirstDraft(): Promise<FetchResult<IncomingOrderDraft | null>> {
  try {
    const res = await fetch(`${API_URL}/api/order-drafts`, { credentials: "include" });
    if (!res.ok) throw new Error(`GET /api/order-drafts failed: ${res.status}`);
    const drafts = (await res.json()) as ApiDraft[];
    const first = drafts.length > 0 ? drafts[0] : null;
    writeCache(CACHE_KEYS.draft, first);
    return { data: first ? toDraft(first) : null, offline: false };
  } catch {
    const cached = readCache<ApiDraft | null>(CACHE_KEYS.draft);
    return { data: cached?.data ? toDraft(cached.data) : null, offline: true, cachedAt: cached?.cachedAt };
  }
}

async function fetchJobs(): Promise<FetchResult<ProductionJob[]>> {
  try {
    const res = await fetch(`${API_URL}/api/production-jobs`, { credentials: "include" });
    if (!res.ok) throw new Error(`GET /api/production-jobs failed: ${res.status}`);
    const data = await res.json();
    const raw = data.productionJobs as ApiProductionJob[];
    writeCache(CACHE_KEYS.jobs, raw);
    return { data: raw.map(toJob), offline: false };
  } catch {
    const cached = readCache<ApiProductionJob[]>(CACHE_KEYS.jobs);
    return { data: (cached?.data ?? []).map(toJob), offline: true, cachedAt: cached?.cachedAt };
  }
}

/** navigator.onLine is a hint, not a guarantee (it can say "online" on a captive portal or a dead Wi-Fi router) — good enough to pick a more specific message, not to decide whether to attempt the request at all. */
function offlineAwareErrorMessage(fallback: string): string {
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return "You're offline — this will save once you're back online.";
  }
  return fallback;
}

export default function SalesPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [jobs, setJobs] = useState<ProductionJob[]>([]);
  const [draft, setDraft] = useState<IncomingOrderDraft | null>(null);
  const [view, setView] = useState<View>("board");
  const [showStages, setShowStages] = useState(true);
  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [newOrderOpen, setNewOrderOpen] = useState(false);
  const [newOrderError, setNewOrderError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [pendingMove, setPendingMove] = useState<{ orderId: string; fromStatus: OrderStatus; toStatus: OrderStatus } | null>(
    null
  );
  /** True once the board is known to be showing a cached snapshot rather than a live fetch — see src/lib/offlineCache.ts. */
  const [offline, setOffline] = useState(false);
  const [cachedAt, setCachedAt] = useState<string | null>(null);
  /** Surfaced for write actions (move/save/create/approve) that fail — separate from newOrderError, which stays scoped to the New Order dialog itself. */
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const [ordersResult, jobsResult, draftResult] = await Promise.all([fetchOrders(), fetchJobs(), fetchFirstDraft()]);
      setOrders(ordersResult.data);
      setJobs(jobsResult.data);
      setDraft(draftResult.data);

      const anyOffline = ordersResult.offline || jobsResult.offline || draftResult.offline;
      setOffline(anyOffline);
      setCachedAt(anyOffline ? ordersResult.cachedAt ?? jobsResult.cachedAt ?? draftResult.cachedAt ?? null : null);
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter(
      (o) =>
        o.number.toLowerCase().includes(q) ||
        o.customer.toLowerCase().includes(q) ||
        o.lineItems.some((li) => li.product.toLowerCase().includes(q))
    );
  }, [orders, search]);

  /** Dragging a card only stages the move — see PendingMoveBanner. Nothing is sent to the server until handleSaveMove. */
  function handleMove(orderId: string, toStatus: OrderStatus) {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    // Dropped back onto its own real column — same as clicking Undo.
    if (toStatus === order.status) {
      setPendingMove(null);
      return;
    }

    setPendingMove({ orderId, fromStatus: order.status, toStatus });
  }

  function handleUndoMove() {
    setPendingMove(null);
  }

  /** Re-fetches orders after a write and keeps the offline indicator in sync — a write that appeared to succeed but was followed by a dropped connection on the refresh still needs to show "offline", not silently keep stale data. */
  async function refreshOrders() {
    const result = await fetchOrders();
    setOrders(result.data);
    setOffline(result.offline);
    setCachedAt(result.offline ? result.cachedAt ?? null : null);
  }

  async function handleSaveMove() {
    if (!pendingMove) return;
    setActionError(null);
    try {
      const res = await fetch(`${API_URL}/api/orders/${pendingMove.orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: pendingMove.toStatus }),
      });
      if (!res.ok) throw new Error(`PATCH status failed: ${res.status}`);
      setPendingMove(null);
      await refreshOrders();
    } catch (error) {
      console.error("Error updating order status:", error);
      setActionError(offlineAwareErrorMessage("Couldn't save that move. Please try again."));
    }
  }

  async function handleSaveOrder(patch: Partial<OrderEditableFields>) {
    if (!selectedOrder) return;
    setActionError(null);
    try {
      const res = await fetch(`${API_URL}/api/orders/${selectedOrder.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        // The update endpoint replaces the whole record, so unchanged fields
        // are sent as-is (status included) rather than left undefined.
        body: JSON.stringify({
          customer: patch.customer ?? selectedOrder.customer,
          lineItems: patch.lineItems ?? selectedOrder.lineItems,
          status: selectedOrder.status,
          date: patch.date ?? selectedOrder.date,
        }),
      });
      if (!res.ok) throw new Error(`PUT order failed: ${res.status}`);
      setSelectedOrder(null);
      await refreshOrders();
    } catch (error) {
      console.error("Error saving order:", error);
      setActionError(offlineAwareErrorMessage("Couldn't save that order. Please try again."));
    }
  }

  async function handleCreateOrder(data: NewOrderData) {
    setNewOrderError(null);
    try {
      const res = await fetch(`${API_URL}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          customer: data.customer,
          lineItems: data.lineItems,
          date: new Date().toISOString(),
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        setNewOrderError(body.error ?? "Couldn't create the order.");
        return;
      }
      setNewOrderOpen(false);
      await refreshOrders();
    } catch (error) {
      console.error("Error creating order:", error);
      setNewOrderError(offlineAwareErrorMessage("Couldn't reach the server. Please try again."));
    }
  }

  function handleDraftLineItemChange(index: number, patch: Partial<DraftLineItem>) {
    setDraft((prev) => (prev ? prev.withLineItem(index, patch) : prev));
  }

  async function handleApproveDraft() {
    if (!draft) return;
    setActionError(null);
    try {
      // Persist any local edits first — the approve endpoint reads lineItems
      // fresh from the database, not whatever's currently on screen.
      const putRes = await fetch(`${API_URL}/api/order-drafts/${draft.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          customer: draft.customer,
          emailSubject: draft.emailSubject,
          lineItems: draft.lineItems,
        }),
      });
      if (!putRes.ok) throw new Error(`PUT draft failed: ${putRes.status}`);

      const approveRes = await fetch(`${API_URL}/api/order-drafts/${draft.id}/approve`, {
        method: "POST",
        credentials: "include",
      });
      if (!approveRes.ok) throw new Error(`POST approve failed: ${approveRes.status}`);

      setDrawerOpen(false);
      await refreshOrders();
      const draftResult = await fetchFirstDraft();
      setDraft(draftResult.data);
    } catch (error) {
      console.error("Error approving draft:", error);
      setActionError(offlineAwareErrorMessage("Couldn't approve that draft. Please try again."));
    }
  }

  return (
    <>
      <PageHeader
        title="Sales & Orders"
        subtitle="Drag orders between stages as they progress."
        actions={
          <>
            {offline && (
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[12px] font-medium rounded-full bg-[var(--color-accent-900)] border border-[var(--color-accent-700)] text-[var(--color-accent-300)]"
                title={cachedAt ? `Showing data cached ${new Date(cachedAt).toLocaleString()}` : "Showing cached data"}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent-300)]" />
                Offline — showing cached data
              </span>
            )}
            <button
              type="button"
              onClick={() => setShowStages((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium rounded-[var(--radius-md)] border transition-all cursor-pointer ${
                showStages
                  ? "bg-[color-mix(in_srgb,var(--color-accent)_15%,transparent)] border-[var(--color-accent)] text-[var(--color-accent)] shadow-[0_0_8px_rgba(var(--color-accent),0.15)]"
                  : "bg-[var(--color-surface)] border-[var(--color-divider)] text-[var(--color-neutral-400)] hover:text-[var(--color-text)] hover:border-[var(--color-neutral-600)]"
              }`}
              title={showStages ? "Hide 4-stage pipeline on cards" : "Show 4-stage pipeline on cards"}
            >
              <span
                className={`w-2 h-2 rounded-full transition-colors ${
                  showStages ? "bg-[var(--color-accent)]" : "bg-[var(--color-neutral-600)]"
                }`}
              />
              Stages
            </button>
            <SegmentedControl
              name="sview"
              value={view}
              onChange={setView}
              options={[
                { value: "board", label: "Board" },
                { value: "table", label: "Table" },
              ]}
            />
            <Input
              className="w-[220px]"
              placeholder="Search orders..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {draft && (
              <Button variant="secondary" onClick={() => setDrawerOpen(true)}>
                Review draft
              </Button>
            )}
            <Button variant="primary" onClick={() => setNewOrderOpen(true)}>
              New Order
              <PlusIcon />
            </Button>
          </>
        }
      />
      <div className="relative flex-1 overflow-hidden">
        <div className="h-full overflow-auto px-8 pt-6 pb-10">
          {actionError && (
            <div className="mb-4 flex items-center justify-between gap-3 text-[13px] text-[var(--color-accent-300)] bg-[var(--color-accent-900)] border border-[var(--color-accent-700)] rounded-[var(--radius-md)] px-3 py-2">
              <span>{actionError}</span>
              <button
                type="button"
                onClick={() => setActionError(null)}
                aria-label="Dismiss"
                className="text-[var(--color-accent-300)] hover:text-[var(--color-accent-100)] cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}
          {view === "table" ? (
            <OrderTable orders={filtered} onSelect={setSelectedOrder} />
          ) : (
            <OrderBoard
              orders={filtered}
              jobs={jobs}
              showStages={showStages}
              pendingMove={pendingMove ? { orderId: pendingMove.orderId, status: pendingMove.toStatus } : null}
              onMove={handleMove}
              onSelect={setSelectedOrder}
            />
          )}
        </div>

        {drawerOpen && draft && (
          <NewOrderDrawer
            draft={draft}
            onClose={() => setDrawerOpen(false)}
            onLineItemChange={handleDraftLineItemChange}
            onApprove={handleApproveDraft}
          />
        )}

        {selectedOrder && (
          <OrderDetailDialog order={selectedOrder} onClose={() => setSelectedOrder(null)} onSave={handleSaveOrder} />
        )}

        {newOrderOpen && (
          <NewOrderDialog
            error={newOrderError}
            onClose={() => {
              setNewOrderOpen(false);
              setNewOrderError(null);
            }}
            onSubmit={handleCreateOrder}
          />
        )}
      </div>

      {pendingMove &&
        (() => {
          const order = orders.find((o) => o.id === pendingMove.orderId);
          return order ? (
            <PendingMoveBanner
              label={order.number}
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
