"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { ShipmentTable } from "@/components/shipments/ShipmentTable";
import { ShipmentDetailDialog } from "@/components/shipments/ShipmentDetailDialog";
import { NewShipmentDialog, type NewShipmentData } from "@/components/shipments/NewShipmentDialog";
import { Shipment, type ShipmentEditableFields, type ShipmentStatus } from "@/domain/Shipment";
import { Order, type OrderStatus, type OrderLineItem } from "@/domain/Order";
import { API_URL } from "@/lib/apiUrl";
import { readCache, writeCache } from "@/lib/offlineCache";

const CACHE_KEYS = {
  shipments: "shipments",
};

function fmtDate(value: string): string {
  if (!value) return value;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

interface ApiOrderEmbed {
  id: string;
  number: string;
  customer: string;
  lineItems: OrderLineItem[];
  status: OrderStatus;
  date: string;
}

interface ApiShipment {
  id: string;
  number: string;
  orderId: string;
  order?: ApiOrderEmbed;
  invoiceId: string | null;
  invoice?: { id: string; number: string };
  status: ShipmentStatus;
  date: string;
}

interface FetchResult<T> {
  data: T;
  orderById: Map<string, Order>;
  offline: boolean;
  cachedAt?: string;
}

function toOrder(o: ApiOrderEmbed): Order {
  return new Order({
    id: o.id,
    number: o.number,
    customer: o.customer,
    lineItems: o.lineItems,
    status: o.status,
    date: fmtDate(o.date),
  });
}

function toShipment(s: ApiShipment): Shipment {
  return new Shipment({
    id: s.id,
    number: s.number,
    orderId: s.orderId,
    invoiceId: s.invoiceId,
    invoiceNumber: s.invoice?.number ?? null,
    status: s.status,
    date: fmtDate(s.date),
  });
}

function processApiShipments(apiShipments: ApiShipment[]): { shipments: Shipment[]; orderById: Map<string, Order> } {
  const orderById = new Map<string, Order>();
  for (const s of apiShipments) {
    if (s.order) orderById.set(s.orderId, toOrder(s.order));
  }
  return { shipments: apiShipments.map(toShipment), orderById };
}

/** Fetches shipments from API; falls back to localStorage cache on failure to support offline drivers/warehouse. */
async function fetchShipments(): Promise<FetchResult<Shipment[]>> {
  try {
    const res = await fetch(`${API_URL}/api/shipments`, { credentials: "include" });
    if (!res.ok) throw new Error(`GET /api/shipments failed: ${res.status}`);
    const data = await res.json();
    const raw = (data.shipments ?? []) as ApiShipment[];
    writeCache(CACHE_KEYS.shipments, raw);
    const { shipments, orderById } = processApiShipments(raw);
    return { data: shipments, orderById, offline: false };
  } catch {
    const cached = readCache<ApiShipment[]>(CACHE_KEYS.shipments);
    const raw = cached?.data ?? [];
    const { shipments, orderById } = processApiShipments(raw);
    return { data: shipments, orderById, offline: true, cachedAt: cached?.cachedAt };
  }
}

export default function ShipmentsPage() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [orderById, setOrderById] = useState<Map<string, Order>>(new Map());
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [newShipmentOpen, setNewShipmentOpen] = useState(false);
  const [newShipmentError, setNewShipmentError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);
  const [cachedAt, setCachedAt] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const result = await fetchShipments();
        setShipments(result.data);
        setOrderById(result.orderById);
        setOffline(result.offline);
        setCachedAt(result.offline ? result.cachedAt ?? null : null);
      } catch (error) {
        console.error("Error fetching shipments:", error);
      }
    })();
  }, []);

  async function refreshShipments() {
    const result = await fetchShipments();
    setShipments(result.data);
    setOrderById(result.orderById);
    setOffline(result.offline);
    setCachedAt(result.offline ? result.cachedAt ?? null : null);
  }

  async function handleSave(patch: Partial<ShipmentEditableFields>) {
    if (!selectedShipment) return;
    setActionError(null);
    try {
      const res = await fetch(`${API_URL}/api/shipments/${selectedShipment.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error(`PUT /api/shipments failed: ${res.status}`);
      setSelectedShipment(null);
      await refreshShipments();
    } catch (error) {
      console.error("Error updating shipment:", error);
      setActionError(offline ? "Cannot update shipment while offline. A live connection is required." : "Failed to update shipment.");
    }
  }

  async function handleDispatch(id: string) {
    setActionError(null);
    try {
      const res = await fetch(`${API_URL}/api/shipments/${id}/dispatch`, {
        method: "PATCH",
        credentials: "include",
      });
      if (!res.ok) throw new Error(`PATCH dispatch failed: ${res.status}`);
      setSelectedShipment(null);
      await refreshShipments();
    } catch (error) {
      console.error("Error dispatching shipment:", error);
      setActionError(offline ? "Cannot dispatch shipment while offline. A live connection is required." : "Failed to dispatch shipment.");
    }
  }

  async function handleDeliver(id: string) {
    setActionError(null);
    try {
      const res = await fetch(`${API_URL}/api/shipments/${id}/deliver`, {
        method: "PATCH",
        credentials: "include",
      });
      if (!res.ok) throw new Error(`PATCH deliver failed: ${res.status}`);
      setSelectedShipment(null);
      await refreshShipments();
    } catch (error) {
      console.error("Error delivering shipment:", error);
      setActionError(offline ? "Cannot mark delivery while offline. A live connection is required." : "Failed to deliver shipment.");
    }
  }

  async function handleCreateShipment(data: NewShipmentData) {
    setNewShipmentError(null);
    try {
      const res = await fetch(`${API_URL}/api/shipments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      const body = await res.json();
      if (!res.ok) {
        setNewShipmentError(body.error ?? "Couldn't create the shipment.");
        return;
      }
      setNewShipmentOpen(false);
      await refreshShipments();
    } catch (error) {
      console.error("Error creating shipment:", error);
      setNewShipmentError("Couldn't reach the server. Please check your connection.");
    }
  }

  return (
    <>
      <PageHeader
        title="Shipments"
        subtitle="Dispatch and delivery tracking."
        actions={
          <Button variant="primary" onClick={() => setNewShipmentOpen(true)}>
            New Shipment
          </Button>
        }
      />
      <div className="flex-1 overflow-auto px-8 pt-6 pb-10">
        {/* Offline cache notice banner */}
        {offline && (
          <div className="mb-4 flex items-center justify-between gap-3 text-[13px] text-[var(--color-neutral-300)] bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-[var(--radius-md)] px-3 py-2.5 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span>
                <strong>Offline Manifest Mode:</strong> Network unreachable. Viewing cached manifest snapshot
                {cachedAt ? ` (as of ${new Date(cachedAt).toLocaleTimeString()})` : ""}.
              </span>
            </div>
            <span className="text-xs text-[var(--color-neutral-400)]">Changes require live network</span>
          </div>
        )}

        {/* Action error banner */}
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

        <ShipmentTable shipments={shipments} orderById={orderById} onSelect={setSelectedShipment} />
      </div>

      {selectedShipment && (
        <ShipmentDetailDialog
          shipment={selectedShipment}
          customer={orderById.get(selectedShipment.orderId)?.customer ?? "—"}
          orderNumber={orderById.get(selectedShipment.orderId)?.number ?? selectedShipment.orderId}
          onClose={() => setSelectedShipment(null)}
          onSave={handleSave}
          onDispatch={handleDispatch}
          onDeliver={handleDeliver}
        />
      )}

      {newShipmentOpen && (
        <NewShipmentDialog
          error={newShipmentError}
          onClose={() => {
            setNewShipmentOpen(false);
            setNewShipmentError(null);
          }}
          onSubmit={handleCreateShipment}
        />
      )}
    </>
  );
}
