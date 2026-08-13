import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "FlowERP",
  description: "FlowERP — orders, invoicing, inventory, shipments and production in one dashboard.",
};

/**
 * Root layout — deliberately minimal (fonts + global CSS only). The
 * app shell (ERPStoreProvider + Sidebar) lives one level down in
 * (app)/layout.tsx instead, because /login must NOT render inside that
 * shell — a route group is what lets /dashboard, /sales, etc. share the
 * shell while /login opts out, without duplicating the <html>/<body>.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="h-full m-0 bg-[var(--color-bg)] text-[var(--color-text)]">{children}</body>
    </html>
  );
}
