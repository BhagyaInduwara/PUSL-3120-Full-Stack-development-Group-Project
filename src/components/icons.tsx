import type { SVGProps } from "react";

/**
 * Nav/status icons — ported 1:1 from the inline SVGs in FlowERP Dashboard.dc.html
 * so the sidebar and stat cards render pixel-identical glyphs to the source design.
 */
const base: SVGProps<SVGSVGElement> = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

export function DashboardIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

export function SalesIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M6 8h12l-1.2 12.5a1 1 0 0 1-1 .9H8.2a1 1 0 0 1-1-.9L6 8z" />
      <path d="M9 8V6.5a3 3 0 0 1 6 0V8" />
    </svg>
  );
}

export function InvoicingIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M6 3h12v18l-2.5-1.5L13 21l-2.5-1.5L8 21l-2-1.5V3z" />
      <line x1="9" y1="8" x2="15" y2="8" />
      <line x1="9" y1="12" x2="15" y2="12" />
      <line x1="9" y1="16" x2="13" y2="16" />
    </svg>
  );
}

export function InventoryIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M3 8l9-4.5L21 8v8l-9 4.5L3 16V8z" />
      <path d="M3 8l9 4.5L21 8" />
      <line x1="12" y1="12.5" x2="12" y2="21" />
    </svg>
  );
}

export function ShipmentIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <rect x="2" y="8" width="12" height="8" rx="1" />
      <path d="M14 11h4l3 3v2h-7" />
      <circle cx="6.5" cy="18" r="1.6" />
      <circle cx="17" cy="18" r="1.6" />
    </svg>
  );
}

export function ProductionIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M3 21V11l4-2.5V11l5-3v3l5-3v13H3z" />
      <line x1="7" y1="15" x2="7" y2="17" />
      <line x1="12" y1="15" x2="12" y2="17" />
      <line x1="17" y1="15" x2="17" y2="17" />
    </svg>
  );
}

export function SettingsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="3" />
      <circle cx="12" cy="12" r="7.5" />
      <line x1="12" y1="2.5" x2="12" y2="4.5" />
      <line x1="12" y1="19.5" x2="12" y2="21.5" />
      <line x1="2.5" y1="12" x2="4.5" y2="12" />
      <line x1="19.5" y1="12" x2="21.5" y2="12" />
    </svg>
  );
}

export function PendingOrdersIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} stroke="var(--color-accent)" {...props}>
      <rect x="5" y="4" width="14" height="17" rx="2" />
      <path d="M9 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1" />
      <path d="M8.5 13l2 2 4-4.5" />
    </svg>
  );
}

export function LowStockIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} stroke="var(--color-accent-300)" {...props}>
      <path d="M12 3.5 21 20H3L12 3.5z" />
      <line x1="12" y1="9" x2="12" y2="14" />
    </svg>
  );
}

export function PlusIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width={14} height={14} viewBox="0 0 256 256" fill="currentColor" {...props}>
      <path d="M221.66,133.66l-72,72a8,8,0,0,1-11.32-11.32L196.69,136H40a8,8,0,0,1,0-16H196.69L138.34,61.66a8,8,0,0,1,11.32-11.32l72,72A8,8,0,0,1,221.66,133.66Z" />
    </svg>
  );
}

export function CloseIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width={14} height={14} viewBox="0 0 256 256" fill="currentColor" {...props}>
      <path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z" />
    </svg>
  );
}

export function MailParsedIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width={16} height={16} viewBox="0 0 256 256" fill="var(--color-accent-300)" {...props}>
      <path d="M224,48H32a8,8,0,0,0-8,8V192a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A8,8,0,0,0,224,48Zm-96,85.15L52.57,64H203.43ZM98.71,128,40,181.81V74.19Zm11.93,10.85,12.79,11.75a8,8,0,0,0,10.94,0l12.79-11.75L207.43,192H48.57Zm46.65-10.85L216,74.18V181.82Z" />
    </svg>
  );
}
