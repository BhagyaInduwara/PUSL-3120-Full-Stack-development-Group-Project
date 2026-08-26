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
type View = "board" | "table";

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

/** Pure fetches, no setState — see production/page.tsx for why (react-hooks/set-state-in-effect). */
async function fetchOrders(): Promise<Order[]> {
  const res = await fetch(`${API_URL}/api/orders`, { credentials: "include" });
  if (!res.ok) return [];
  return (await res.json() as ApiOrder[]).map(toOrder);
}

async function fetchFirstDraft(): Promise<IncomingOrderDraft | null> {
  const res = await fetch(`${API_URL}/api/order-drafts`, { credentials: "include" });
  if (!res.ok) return null;
  const drafts = (await res.json()) as ApiDraft[];
  return drafts.length > 0 ? toDraft(drafts[0]) : null;
}

async function fetchJobs(): Promise<ProductionJob[]> {
  const res = await fetch(`${API_URL}/api/production-jobs`, { credentials: "include" });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.productionJobs as ApiProductionJob[]).map(toJob);
}

export default function SalesPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [jobs, setJobs] = useState<ProductionJob[]>([]);
  const [draft, setDraft] = useState<IncomingOrderDraft | null>(null);
  const [view, setView] = useState<View>("board");
  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [newOrderOpen, setNewOrderOpen] = useState(false);
  const [newOrderError, setNewOrderError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [pendingMove, setPendingMove] = useState<{ orderId: string; fromStatus: OrderStatus; toStatus: OrderStatus } | null>(
    null
  );

  useEffect(() => {
    (async () => {
      try {
        setOrders(await fetchOrders());
        setJobs(await fetchJobs());
        setDraft(await fetchFirstDraft());
      } catch (error) {
        console.error("Error fetching orders:", error);
      }
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

  async function handleSaveMove() {
    if (!pendingMove) return;
    try {
      await fetch(`${API_URL}/api/orders/${pendingMove.orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: pendingMove.toStatus }),
      });
      setPendingMove(null);
      setOrders(await fetchOrders());
    } catch (error) {
      console.error("Error updating order status:", error);
    }
  }

  async function handleSaveOrder(patch: Partial<OrderEditableFields>) {
    if (!selectedOrder) return;
    try {
      await fetch(`${API_URL}/api/orders/${selectedOrder.id}`, {
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
      setSelectedOrder(null);
      setOrders(await fetchOrders());
    } catch (error) {
      console.error("Error saving order:", error);
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
      setOrders(await fetchOrders());
    } catch (error) {
      console.error("Error creating order:", error);
      setNewOrderError("Couldn't reach the server. Please try again.");
    }
  }

  function handleDraftLineItemChange(index: number, patch: Partial<DraftLineItem>) {
    setDraft((prev) => (prev ? prev.withLineItem(index, patch) : prev));
  }

  async function handleApproveDraft() {
    if (!draft) return;
    try {
      // Persist any local edits first — the approve endpoint reads lineItems
      // fresh from the database, not whatever's currently on screen.
      await fetch(`${API_URL}/api/order-drafts/${draft.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          customer: draft.customer,
          emailSubject: draft.emailSubject,
          lineItems: draft.lineItems,
        }),
      });
      await fetch(`${API_URL}/api/order-drafts/${draft.id}/approve`, {
        method: "POST",
        credentials: "include",
      });
      setDrawerOpen(false);
      setOrders(await fetchOrders());
      setDraft(await fetchFirstDraft());
    } catch (error) {
      console.error("Error approving draft:", error);
    }
  }

  return (
    <>
      <PageHeader
        title="Sales & Orders"
        subtitle="Drag orders between stages as they progress."
        actions={
          <>
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
          {view === "table" ? (
            <OrderTable orders={filtered} onSelect={setSelectedOrder} />
          ) : (
            <OrderBoard
              orders={filtered}
              jobs={jobs}
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
