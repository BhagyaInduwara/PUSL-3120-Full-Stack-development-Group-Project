"use client";

import { useERPStore } from "@/store/useERPStore";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { ShipmentTable } from "@/components/shipments/ShipmentTable";

export default function ShipmentsPage() {
  const store = useERPStore();

  return (
    <>
      <PageHeader
        title="Shipments"
        subtitle="Dispatch and delivery tracking."
        actions={<Button variant="primary">New Shipment</Button>}
      />
      <div className="flex-1 overflow-auto px-8 pt-6 pb-10">
        <ShipmentTable shipments={store.shipments} />
      </div>
    </>
  );
}
