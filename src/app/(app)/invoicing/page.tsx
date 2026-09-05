"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { InvoiceTable } from "@/components/invoicing/InvoiceTable";
import { InvoiceDetailDialog } from "@/components/invoicing/InvoiceDetailDialog";
import { NewInvoiceDialog, type NewInvoiceData } from "@/components/invoicing/NewInvoiceDialog";
import { Invoice, type InvoiceEditableFields, type InvoiceStatus } from "@/domain/Invoice";
import { Order, type OrderStatus, type OrderLineItem } from "@/domain/Order";

import { API_URL } from "@/lib/apiUrl";

const CACHE_KEY_INVOICES = "flowerp_cache_invoices";
const CACHE_KEY_ORDERS = "flowerp_cache_orders";

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

interface ApiInvoice {
  id: string;
  number: string;
  orderId: string;
  order?: ApiOrderEmbed;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
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

function toInvoice(i: ApiInvoice): Invoice {
  return new Invoice({
    id: i.id,
    number: i.number,
    orderId: i.orderId,
    status: i.status,
    issueDate: fmtDate(i.issueDate),
    dueDate: fmtDate(i.dueDate),
  });
}

/** Helper to load cached data from localStorage when offline */
function loadFromCache(): { invoices: Invoice[]; orderById: Map<string, Order> } {
  try {
    if (typeof window === "undefined") return { invoices: [], orderById: new Map() };
    const cachedInvoicesJson = localStorage.getItem(CACHE_KEY_INVOICES);
    const cachedOrdersJson = localStorage.getItem(CACHE_KEY_ORDERS);

    if (!cachedInvoicesJson) return { invoices: [], orderById: new Map() };

    const apiInvoices = JSON.parse(cachedInvoicesJson) as ApiInvoice[];
    const rawOrders = cachedOrdersJson ? (JSON.parse(cachedOrdersJson) as [string, ApiOrderEmbed][]) : [];
    
    const orderById = new Map<string, Order>(rawOrders.map(([id, o]) => [id, toOrder(o)]));
    const invoices = apiInvoices.map(toInvoice);

    return { invoices, orderById };
  } catch (e) {
    console.error("Failed to load offline cache:", e);
    return { invoices: [], orderById: new Map() };
  }
}

/** Helper to save fetched data to localStorage for offline access */
function saveToCache(apiInvoices: ApiInvoice[], orderByIdMap: Map<string, Order>) {
  try {
    if (typeof window === "undefined") return;
    localStorage.setItem(CACHE_KEY_INVOICES, JSON.stringify(apiInvoices));
    
    // Serialize Map entries for storage with a mutable copy of lineItems
    const serializableOrders: [string, ApiOrderEmbed][] = [];
    orderByIdMap.forEach((order, id) => {
      serializableOrders.push([id, {
        id: order.id,
        number: order.number,
        customer: order.customer,
        lineItems: [...order.lineItems],
        status: order.status,
        date: order.date,
      }]);
    });
    localStorage.setItem(CACHE_KEY_ORDERS, JSON.stringify(serializableOrders));
  } catch (e) {
    console.error("Failed to save offline cache:", e);
  }
}

async function fetchInvoices(): Promise<{ invoices: Invoice[]; orderById: Map<string, Order> }> {
  try {
    const res = await fetch(`${API_URL}/api/invoices`, { credentials: "include" });
    if (!res.ok) throw new Error("Network response was not ok");
    
    const data = await res.json();
    const apiInvoices = data.invoices as ApiInvoice[];
    const orderById = new Map<string, Order>();
    
    for (const i of apiInvoices) {
      if (i.order) orderById.set(i.orderId, toOrder(i.order));
    }

    // Save successfully fetched data to local storage cache
    saveToCache(apiInvoices, orderById);

    return { invoices: apiInvoices.map(toInvoice), orderById };
  } catch (error) {
    // Fallback to offline cache if network fetch fails
    console.warn("Network request failed, falling back to local cache:", error);
    return loadFromCache();
  }
}

export default function InvoicingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [orderById, setOrderById] = useState<Map<string, Order>>(new Map());
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [newInvoiceOpen, setNewInvoiceOpen] = useState(false);
  const [newInvoiceError, setNewInvoiceError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      // Instantly load from cache first for zero-latency offline rendering
      const cached = loadFromCache();
      if (cached.invoices.length > 0) {
        setInvoices(cached.invoices);
        setOrderById(cached.orderById);
      }

      // Then fetch fresh data from network in background
      try {
        const { invoices, orderById } = await fetchInvoices();
        if (invoices.length > 0) {
          setInvoices(invoices);
          setOrderById(orderById);
        }
      } catch (error) {
        console.error("Error fetching invoices:", error);
      }
    })();
  }, []);

  async function handleSave(patch: Partial<InvoiceEditableFields>) {
    if (!selectedInvoice) return;
    try {
      await fetch(`${API_URL}/api/invoices/${selectedInvoice.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(patch),
      });
      setSelectedInvoice(null);
      const { invoices, orderById } = await fetchInvoices();
      setInvoices(invoices);
      setOrderById(orderById);
    } catch (error) {
      console.error("Error updating invoice:", error);
    }
  }

  async function handleCreateInvoice(data: NewInvoiceData) {
    setNewInvoiceError(null);
    try {
      const res = await fetch(`${API_URL}/api/invoices`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      const body = await res.json();
      if (!res.ok) {
        setNewInvoiceError(body.error ?? "Couldn't create the invoice.");
        return;
      }
      setNewInvoiceOpen(false);
      const { invoices, orderById } = await fetchInvoices();
      setInvoices(invoices);
      setOrderById(orderById);
    } catch (error) {
      console.error("Error creating invoice:", error);
      setNewInvoiceError("Couldn't reach the server. Please try again.");
    }
  }

  async function handleMarkPaid() {
    if (!selectedInvoice) return;
    try {
      await fetch(`${API_URL}/api/invoices/${selectedInvoice.id}/mark-paid`, {
        method: "PATCH",
        credentials: "include",
      });
      setSelectedInvoice(null);
      const { invoices, orderById } = await fetchInvoices();
      setInvoices(invoices);
      setOrderById(orderById);
    } catch (error) {
      console.error("Error marking invoice paid:", error);
    }
  }

  return (
    <>
      <PageHeader
        title="Invoicing"
        subtitle="Track billing status across every order."
        actions={
          <Button variant="primary" onClick={() => setNewInvoiceOpen(true)}>
            New Invoice
          </Button>
        }
      />
      <div className="flex-1 overflow-auto px-8 pt-6 pb-10">
        <InvoiceTable invoices={invoices} orderById={orderById} onSelect={setSelectedInvoice} />
      </div>

      {selectedInvoice && (
        <InvoiceDetailDialog
          invoice={selectedInvoice}
          order={orderById.get(selectedInvoice.orderId)}
          onClose={() => setSelectedInvoice(null)}
          onSave={handleSave}
          onMarkPaid={handleMarkPaid}
        />
      )}

      {newInvoiceOpen && (
        <NewInvoiceDialog
          error={newInvoiceError}
          onClose={() => {
            setNewInvoiceOpen(false);
            setNewInvoiceError(null);
          }}
          onSubmit={handleCreateInvoice}
        />
      )}
    </>
  );
}