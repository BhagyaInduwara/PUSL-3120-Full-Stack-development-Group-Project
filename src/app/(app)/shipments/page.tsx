"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { ShipmentTable } from "@/components/shipments/ShipmentTable";
import { ShipmentDetailDialog } from "@/components/shipments/ShipmentDetailDialog";
import { Shipment, type ShipmentEditableFields, type ShipmentStatus } from "@/domain/Shipment";
import { Order, type OrderStatus, type OrderLineItem } from "@/domain/Order";

const API_URL = "http://localhost:4000";

function fmtDate(value: string): string {
  if (!value) return value;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

interface ApiOrderEmbed {
  id: string;
  customer: string;
  lineItems: OrderLineItem[];
  status: OrderStatus;
  date: string;
}

interface ApiShipment {
  id: string;
  orderId: string;
  order?: ApiOrderEmbed;
  invoiceId: string | null;
  status: ShipmentStatus;
  date: string;
}

function toOrder(o: ApiOrderEmbed): Order {
  return new Order({
    id: o.id,
    customer: o.customer,
    lineItems: o.lineItems,
    status: o.status,
    date: fmtDate(o.date),
  });
}

function toShipment(s: ApiShipment): Shipment {
  return new Shipment({
    id: s.id,
    orderId: s.orderId,
    invoiceId: s.invoiceId,
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

  return (
    <>
      <PageHeader
        title="Shipments"
        subtitle="Dispatch and delivery tracking."
        actions={<Button variant="primary">New Shipment</Button>}
      />
      <div className="flex-1 overflow-auto px-8 pt-6 pb-10">
        <ShipmentTable shipments={shipments} orderById={orderById} onSelect={setSelectedShipment} />
      </div>

      {selectedShipment && (
        <ShipmentDetailDialog
          shipment={selectedShipment}
          customer={orderById.get(selectedShipment.orderId)?.customer ?? "—"}
          onClose={() => setSelectedShipment(null)}
          onSave={handleSave}
        />
      )}
    </>
  );
}
