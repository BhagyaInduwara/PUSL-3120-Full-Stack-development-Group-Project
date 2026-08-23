"use client";

import { use, useEffect, useState } from "react";
import { notFound } from "next/navigation";
import { CustomerDetail } from "@/components/settings/CustomerDetail";
import { Customer } from "@/domain/Customer";
import { Order, type OrderStatus } from "@/domain/Order";

const API_URL = "http://localhost:4000";

interface CustomerDetailPageProps {
  params: Promise<{ id: string }>;
}

interface ApiOrder {
  _id: string;
  customer: string;
  product: string;
  qty: number;
  price: number;
  status: OrderStatus;
  date: string;
}

function toOrder(o: ApiOrder): Order {
  return new Order({
    id: o._id,
    customer: o.customer,
    product: o.product,
    qty: o.qty,
    price: o.price,
    status: o.status,
    date: new Date(o.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
  });
}

/** /settings/customers/[id] — renders the full customer profile view, with real order history. */
export default function CustomerDetailPage({ params }: CustomerDetailPageProps) {
  const { id } = use(params);
  const [customer, setCustomer] = useState<Customer | null | undefined>(undefined);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const customerRes = await fetch(`${API_URL}/api/customers/${id}`, { credentials: "include" });
        if (!customerRes.ok) {
          setCustomer(null);
          return;
        }
        const customerData = await customerRes.json();
        const loadedCustomer = new Customer(customerData.customer);
        setCustomer(loadedCustomer);

        const ordersRes = await fetch(`${API_URL}/api/orders`, { credentials: "include" });
        if (ordersRes.ok) {
          const allOrders = ((await ordersRes.json()) as ApiOrder[]).map(toOrder);
          setOrders(allOrders.filter((o) => o.customer === loadedCustomer.name));
        }
      } catch (error) {
        console.error("Error fetching customer:", error);
        setCustomer(null);
      }
    })();
  }, [id]);

  if (customer === null) {
    notFound();
  }
  if (customer === undefined) {
    return <p className="text-sm text-[var(--color-neutral-500)]">Loading…</p>;
  }

  return <CustomerDetail customer={customer} orders={orders} />;
}
