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
import type { Order, OrderStatus } from "@/domain/Order";
import type { Invoice } from "@/domain/Invoice";
import type { Shipment } from "@/domain/Shipment";
import type { JobStatus } from "@/domain/ProductionJob";
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

  // ------------------------------------------------------------ Production
  get jobs() {
    return this.jobRepo.findAll();
  }

  jobsByStatus(status: JobStatus) {
    return this.jobRepo.findByStatus(status);
  }

  // ------------------------------------------------------- Settings/master
  get customers(): Customer[] {
    return this.customerRepo.findAll();
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
}
