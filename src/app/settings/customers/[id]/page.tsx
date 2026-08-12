"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import { useERPStore } from "@/store/useERPStore";
import { CustomerDetail } from "@/components/settings/CustomerDetail";

interface CustomerDetailPageProps {
  params: Promise<{ id: string }>;
}

/** /settings/customers/[id] — renders the full customer profile view. */
export default function CustomerDetailPage({ params }: CustomerDetailPageProps) {
  const { id } = use(params);
  const store = useERPStore();
  const customer = store.findCustomer(id);

  if (!customer) {
    notFound();
  }

  return <CustomerDetail customer={customer} />;
}
