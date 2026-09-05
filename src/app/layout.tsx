import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { THEME_STORAGE_KEY } from "@/components/theme/constants";

/**
 * Runs before React hydrates (a plain synchronous <script>, first thing in
 * <head>) so the correct theme is on <html> for the very first paint —
 * without this, the page would always paint dark first and then flash to
 * light for anyone who'd chosen light mode. Kept tiny and dependency-free
 * on purpose: it runs pre-hydration, so it can't reach into React state or
 * ThemeProvider (which sets this same attribute for every later change).
 */
const NO_FLASH_THEME_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});
    document.documentElement.setAttribute("data-theme", stored === "light" ? "light" : "dark");
  } catch (e) {}
})();
`;

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
 * Root layout — deliberately minimal (fonts, global CSS, and the
 * light/dark theme wiring). The app shell (ERPStoreProvider + Sidebar)
 * lives one level down in (app)/layout.tsx instead, because /login must
 * NOT render inside that shell — a route group is what lets /dashboard,
 * /sales, etc. share the shell while /login opts out, without duplicating
 * the <html>/<body>. Theme lives here rather than in (app)/layout.tsx
 * because /login should also respect the user's chosen theme.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      {/*
        suppressHydrationWarning: the no-flash script below sets data-theme
        on this element before React hydrates, which will always differ
        from the plain server-rendered markup (that has no data-theme at
        all). This tells React that's expected for THIS element only —
        it doesn't suppress mismatches anywhere else in the tree.
      */}
      <head>
        <script dangerouslySetInnerHTML={{ __html: NO_FLASH_THEME_SCRIPT }} />
      </head>
      <body className="h-full m-0 bg-[var(--color-bg)] text-[var(--color-text)]">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
