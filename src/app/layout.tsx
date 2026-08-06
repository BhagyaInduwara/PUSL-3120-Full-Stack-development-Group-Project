import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ERPStoreProvider } from "@/store/ERPStoreProvider";
import { Sidebar } from "@/components/layout/Sidebar";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "FlowERP",
  description: "FlowERP — orders, invoicing, inventory, shipments and production in one dashboard.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="h-full m-0">
        <ERPStoreProvider>
          <div className="flex h-screen bg-[var(--color-bg)] text-[var(--color-text)] font-[family-name:var(--font-body)] overflow-hidden">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden min-w-0">{children}</div>
          </div>
        </ERPStoreProvider>
      </body>
    </html>
  );
}
