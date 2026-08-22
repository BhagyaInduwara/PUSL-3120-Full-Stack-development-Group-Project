"use client";

import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { SegmentedControl } from "@/components/ui/SegmentedControl";

type Tab = "customers" | "suppliers" | "products" | "users";

/** Settings layout — hosts the shared header + tab switcher for the nested routes (/settings/customers|suppliers|products|users), mirroring the original design's single Settings screen with an internal tab state. */
export default function SettingsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const activeTab = (pathname?.split("/")[2] as Tab) ?? "customers";

  return (
    <>
      <div className="px-8 pt-[22px] border-b border-[var(--color-divider)]">
        <h4 className="m-0 mb-1">Settings</h4>
        <div className="text-[13px] text-[var(--color-neutral-500)] mb-4">
          Manage the master data behind orders, invoices and jobs.
        </div>
        <div className="mb-[-1px]">
          <SegmentedControl<Tab>
            name="stab"
            value={activeTab}
            onChange={(tab) => router.push(`/settings/${tab}`)}
            options={[
              { value: "customers", label: "Customers" },
              { value: "suppliers", label: "Suppliers" },
              { value: "products", label: "Products" },
              { value: "users", label: "Users" },
            ]}
          />
        </div>
      </div>
      <div className="flex-1 overflow-auto px-8 pt-6 pb-10">{children}</div>
    </>
  );
}
