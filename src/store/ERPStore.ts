import { Observable } from "./Observable";
import {
  OrderRepository,
  InvoiceRepository,
  ShipmentRepository,
  ProductionJobRepository,
  InventoryRepository,
  CustomerRepository,
  SupplierRepository,
  ProductRepository,
} from "@/repositories";
import { ACTIVITY_FEED_SEED, REVENUE_SERIES_SEED, INCOMING_DRAFT_SEED } from "@/repositories/seed-data";
import { IncomingOrderDraft, type DraftLineItem } from "@/domain/IncomingOrderDraft";
import { Money } from "@/domain/Money";
import type { Order, OrderStatus, OrderEditableFields } from "@/domain/Order";
import type { Invoice, InvoiceEditableFields } from "@/domain/Invoice";
import type { Shipment, ShipmentEditableFields } from "@/domain/Shipment";
import type { ProductionJob, JobStatus, ProductionJobEditableFields } from "@/domain/ProductionJob";
import type { Customer, CustomerProps } from "@/domain/Customer";

/**
 * ERPStore — the application's single source of truth for domain data.
 * It composes the repositories (constructor-free here since each
 * repository seeds itself; a real backend would inject DB clients instead —
 * see Repository.ts) and exposes:
 *   1. Read access to each entity collection.
 *   2. Cross-entity "join" queries (e.g. invoiceCustomer) that the UI needs
 *      but no single repository owns.
 *   3. Action methods that mutate state and notify subscribers.
 *
 * It extends Observable rather than being a React hook itself, so the
 * business logic has no dependency on React — useERPStore (store/useERPStore.ts)
 * is the only place that bridges it into components.
 */
export class ERPStore extends Observable {
  private readonly orderRepo = new OrderRepository();
  private readonly invoiceRepo = new InvoiceRepository();
  private readonly shipmentRepo = new ShipmentRepository();
  private readonly jobRepo = new ProductionJobRepository();
  private readonly inventoryRepo = new InventoryRepository();
  private readonly customerRepo = new CustomerRepository();
  private readonly supplierRepo = new SupplierRepository();
  private readonly productRepo = new ProductRepository();

  private _incomingDraft: IncomingOrderDraft | null = new IncomingOrderDraft(INCOMING_DRAFT_SEED);

  // ---------------------------------------------------------------- Orders
  get orders(): Order[] {
    return this.orderRepo.findAll();
  }

  findOrder(orderId: string): Order | undefined {
    return this.orderRepo.findById(orderId);
  }

  ordersByStatus(status: OrderStatus): Order[] {
    return this.orderRepo.findByStatus(status);
  }

  moveOrderStatus(orderId: string, status: OrderStatus): void {
    this.orderRepo.moveStatus(orderId, status);
    this.notify();
  }

  /** No-ops (via Order.canEdit) once the order is past Draft — see Order.update. */
  updateOrder(orderId: string, patch: Partial<OrderEditableFields>): void {
    this.orderRepo.findById(orderId)?.update(patch);
    this.notify();
  }

  // ------------------------------------------------------- Incoming draft
  get incomingDraft(): IncomingOrderDraft | null {
    return this._incomingDraft;
  }

  updateDraftLineItem(index: number, patch: Partial<DraftLineItem>): void {
    if (!this._incomingDraft) return;
    this._incomingDraft = this._incomingDraft.withLineItem(index, patch);
    this.notify();
  }

  /** Approves the pending draft: turns it into a real Order (via its own factory method) and adds it to the order book. */
  approveIncomingDraft(): Order | undefined {
    if (!this._incomingDraft) return undefined;
    const order = this._incomingDraft.toOrder(this.orderRepo.nextId(), "Today");
    this.orderRepo.add(order);
    this._incomingDraft = null;
    this.notify();
    return order;
  }

  discardIncomingDraft(): void {
    this._incomingDraft = null;
    this.notify();
  }

  // -------------------------------------------------------------- Invoices
  get invoices(): Invoice[] {
    return this.invoiceRepo.findAll();
  }

  findInvoice(id: string): Invoice | undefined {
    return this.invoiceRepo.findById(id);
  }

  /** Every Invoice only stores an orderId; these joins hydrate what the UI needs from the linked Order. */
  invoiceOrder(invoice: Invoice): Order | undefined {
    return this.orderRepo.findById(invoice.orderId);
  }

  invoiceCustomer(invoice: Invoice): string {
    return this.invoiceOrder(invoice)?.customer ?? "—";
  }

  invoiceAmountFormatted(invoice: Invoice): string {
    return (this.invoiceOrder(invoice)?.amount ?? Money.zero()).format();
  }

  markInvoicePaid(id: string): void {
    this.invoiceRepo.findById(id)?.markPaid();
    this.notify();
  }

  updateInvoice(id: string, patch: Partial<InvoiceEditableFields>): void {
    this.invoiceRepo.findById(id)?.update(patch);
    this.notify();
  }

  // ------------------------------------------------------------- Inventory
  get inventory() {
    return this.inventoryRepo.findAll();
  }

  // ------------------------------------------------------------- Shipments
  get shipments(): Shipment[] {
    return this.shipmentRepo.findAll();
  }

  shipmentCustomer(shipment: Shipment): string {
    return this.orderRepo.findById(shipment.orderId)?.customer ?? "—";
  }

  findShipment(id: string): Shipment | undefined {
    return this.shipmentRepo.findById(id);
  }

  updateShipment(id: string, patch: Partial<ShipmentEditableFields>): void {
    this.shipmentRepo.findById(id)?.update(patch);
    this.notify();
  }

  // ------------------------------------------------------------ Production
  get jobs(): ProductionJob[] {
    return this.jobRepo.findAll();
  }

  findJob(id: string): ProductionJob | undefined {
    return this.jobRepo.findById(id);
  }

  jobsByStatus(status: JobStatus): ProductionJob[] {
    return this.jobRepo.findByStatus(status);
  }

  updateJob(id: string, patch: Partial<ProductionJobEditableFields>): void {
    this.jobRepo.findById(id)?.update(patch);
    this.notify();
  }

  // ------------------------------------------------------- Settings/master
  get customers(): Customer[] {
    return this.customerRepo.findAll();
  }

  findCustomer(id: string): Customer | undefined {
    return this.customerRepo.findById(id);
  }

  ordersByCustomer(customerName: string): Order[] {
    return this.orders.filter((o) => o.customer === customerName);
  }

  get suppliers() {
    return this.supplierRepo.findAll();
  }

  get products() {
    return this.productRepo.findAll();
  }

  addCustomer(props: Omit<CustomerProps, "id">): Customer {
    const customer = this.customerRepo.add(props);
    this.notify();
    return customer;
  }

  // ------------------------------------------------------------- Dashboard
  get activityFeed() {
    return ACTIVITY_FEED_SEED;
  }

  get revenueSeries() {
    return REVENUE_SERIES_SEED;
  }

  /** Orders awaiting confirmation or invoicing. */
  get pendingOrdersCount(): number {
    return this.orders.filter((o) => o.status === "Draft" || o.status === "Confirmed").length;
  }

  /** Jobs planned or in progress. */
  get inProductionCount(): number {
    return this.jobs.filter((j) => j.status === "Planned" || j.status === "In Progress").length;
  }

  /** Shipments packed or dispatched — scheduled for dispatch. */
  get shipmentsTodayCount(): number {
    return this.shipments.filter((s) => s.status === "Packed" || s.status === "Dispatched").length;
  }

  get lowStockCount(): number {
    return this.inventory.filter((i) => i.isLow).length;
  }

  /** Aggregate sales volume and percentage share by product category. */
  get salesByCategory(): { category: string; units: number; percentage: number; color: string }[] {
    const categoryColors: Record<string, string> = {
      Seating: "#818cf8", // Soft Indigo / Lavender
      Storage: "#38bdf8", // Soft Sky Cyan
      Desks: "#34d399",   // Soft Mint Emerald
      Tables: "#f472b6",  // Soft Rose Coral
    };


    const categoryUnits: Record<string, number> = {
      Seating: 0,
      Storage: 0,
      Desks: 0,
      Tables: 0,
    };

    for (const order of this.orders) {
      for (const li of order.lineItems) {
        const product = this.products.find((p) => p.name === li.product);
        const category = product?.category ?? "Storage";
        categoryUnits[category] = (categoryUnits[category] ?? 0) + li.qty;
      }
    }

    const total = Object.values(categoryUnits).reduce((sum, u) => sum + u, 0) || 1;

    return Object.entries(categoryUnits).map(([category, units]) => ({
      category,
      units,
      percentage: Number(((units / total) * 100).toFixed(1)),
      color: categoryColors[category] ?? "#94a3b8",
    }));
  }

  get totalSalesUnits(): number {
    return this.orders.reduce((sum, o) => sum + o.totalQty, 0);
  }

  /** Ranked list of top-selling products with sales volume, revenue, category, and inventory status. */
  get topProducts(): {
    rank: number;
    name: string;
    category: string;
    units: number;
    revenueFormatted: string;
    isLowStock: boolean;
    stockQty: number;
  }[] {
    const productStats: Record<string, { units: number; revenue: Money }> = {};

    for (const order of this.orders) {
      for (const li of order.lineItems) {
        if (!productStats[li.product]) {
          productStats[li.product] = { units: 0, revenue: Money.zero() };
        }
        productStats[li.product].units += li.qty;
        productStats[li.product].revenue = productStats[li.product].revenue.add(new Money(li.qty * li.price));
      }
    }

    const sorted = Object.entries(productStats)
      .map(([name, stats]) => {
        const product = this.products.find((p) => p.name === name);
        const inventoryItem = this.inventory.find((i) => i.name === name);
        const category = product?.category ?? inventoryItem?.category ?? "General";
        const isLowStock = inventoryItem?.isLow ?? false;
        const stockQty = inventoryItem?.qty ?? 0;

        return {
          rank: 0,
          name,
          category,
          units: stats.units,
          revenueFormatted: stats.revenue.format(),
          isLowStock,
          stockQty,
        };
      })
      .sort((a, b) => b.units - a.units);

    return sorted.map((item, idx) => ({
      ...item,
      rank: idx + 1,
    }));
  }

}


