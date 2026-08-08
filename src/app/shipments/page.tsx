"use client";

import { useState } from "react";
import { useERPStore } from "@/store/useERPStore";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { ShipmentTable } from "@/components/shipments/ShipmentTable";
import { ShipmentDetailDialog } from "@/components/shipments/ShipmentDetailDialog";
import type { Shipment } from "@/domain/Shipment";

export default function ShipmentsPage() {
  const store = useERPStore();
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);

  return (
    <>
      <PageHeader
        title="Shipments"
        subtitle="Dispatch and delivery tracking."
        actions={<Button variant="primary">New Shipment</Button>}
      />
      <div className="flex-1 overflow-auto px-8 pt-6 pb-10">
        <ShipmentTable shipments={store.shipments} onSelect={setSelectedShipment} />
      </div>

      {selectedShipment && (
        <ShipmentDetailDialog
          shipment={selectedShipment}
          customer={store.shipmentCustomer(selectedShipment)}
          onClose={() => setSelectedShipment(null)}
          onSave={(patch) => store.updateShipment(selectedShipment.id, patch)}
        />
      )}
    </>
  );
}
