"use client";

import { useMemo, useState } from "react";
import { useERPStore } from "@/store/useERPStore";
import { PageHeader } from "@/components/layout/PageHeader";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { PlusIcon } from "@/components/icons";
import { OrderBoard } from "@/components/sales/OrderBoard";
import { OrderTable } from "@/components/sales/OrderTable";
import { NewOrderDrawer } from "@/components/sales/NewOrderDrawer";

type View = "board" | "table";

export default function SalesPage() {
  const store = useERPStore();
  const [view, setView] = useState<View>("board");
  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);

  const orders = store.orders;
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter(
      (o) =>
        o.id.toLowerCase().includes(q) ||
        o.customer.toLowerCase().includes(q) ||
        o.product.toLowerCase().includes(q)
    );
  }, [orders, search]);

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
            <Button variant="primary" onClick={() => setDrawerOpen(true)} disabled={!store.incomingDraft}>
              New Order
              <PlusIcon />
            </Button>
          </>
        }
      />
      <div className="relative flex-1 overflow-hidden">
        <div className="h-full overflow-auto px-8 pt-6 pb-10">
          {view === "table" ? (
            <OrderTable orders={filtered} />
          ) : (
            <OrderBoard orders={filtered} onMove={(id, status) => store.moveOrderStatus(id, status)} />
          )}
        </div>

        {drawerOpen && store.incomingDraft && (
          <NewOrderDrawer
            draft={store.incomingDraft}
            onClose={() => setDrawerOpen(false)}
            onLineItemChange={(i, patch) => store.updateDraftLineItem(i, patch)}
            onApprove={() => {
              store.approveIncomingDraft();
              setDrawerOpen(false);
            }}
          />
        )}
      </div>
    </>
  );
}
