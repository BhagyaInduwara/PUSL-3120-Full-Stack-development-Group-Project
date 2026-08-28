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

async function fetchShipments(): Promise<{ shipments: Shipment[]; orderById: Map<string, Order> }> {
  const res = await fetch(`${API_URL}/api/shipments`, { credentials: "include" });
  if (!res.ok) return { shipments: [], orderById: new Map() };
  const data = await res.json();
  const apiShipments = data.shipments as ApiShipment[];
  const orderById = new Map<string, Order>();
  for (const s of apiShipments) {
    if (s.order) orderById.set(s.orderId, toOrder(s.order));
  }
  return { shipments: apiShipments.map(toShipment), orderById };
}

export default function ShipmentsPage() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [orderById, setOrderById] = useState<Map<string, Order>>(new Map());
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [newShipmentOpen, setNewShipmentOpen] = useState(false);
  const [newShipmentError, setNewShipmentError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { shipments, orderById } = await fetchShipments();
        setShipments(shipments);
        setOrderById(orderById);
      } catch (error) {
        console.error("Error fetching shipments:", error);
      }
    })();
  }, []);

  async function handleSave(patch: Partial<ShipmentEditableFields>) {
    if (!selectedShipment) return;
    try {
      await fetch(`${API_URL}/api/shipments/${selectedShipment.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(patch),
      });
      setSelectedShipment(null);
      const { shipments, orderById } = await fetchShipments();
      setShipments(shipments);
      setOrderById(orderById);
    } catch (error) {
      console.error("Error updating shipment:", error);
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
      const { shipments, orderById } = await fetchShipments();
      setShipments(shipments);
      setOrderById(orderById);
    } catch (error) {
      console.error("Error creating shipment:", error);
      setNewShipmentError("Couldn't reach the server. Please try again.");
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
        <ShipmentTable shipments={shipments} orderById={orderById} onSelect={setSelectedShipment} />
      </div>

      {selectedShipment && (
        <ShipmentDetailDialog
          shipment={selectedShipment}
          customer={orderById.get(selectedShipment.orderId)?.customer ?? "—"}
          orderNumber={orderById.get(selectedShipment.orderId)?.number ?? selectedShipment.orderId}
          onClose={() => setSelectedShipment(null)}
          onSave={handleSave}
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
