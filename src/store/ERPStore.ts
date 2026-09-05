import { Observable } from "./Observable";
import {
  InvoiceRepository,
  ShipmentRepository,
  ProductionJobRepository,
  InventoryRepository,
  CustomerRepository,
  SupplierRepository,
  ProductRepository,
} from "@/repositories";
import { ACTIVITY_FEED_SEED, REVENUE_SERIES_SEED } from "@/repositories/seed-data";
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
 *   2. Cross-entity "join" queries that the UI needs but no single
 *      repository owns.
 *   3. Action methods that mutate state and notify subscribers.
 *
 * It extends Observable rather than being a React hook itself, so the
 * business logic has no dependency on React — useERPStore (store/useERPStore.ts)
 * is the only place that bridges it into components.
 */
export class ERPStore extends Observable {
  private readonly invoiceRepo = new InvoiceRepository();
  private readonly shipmentRepo = new ShipmentRepository();
  private readonly jobRepo = new ProductionJobRepository();
  private readonly inventoryRepo = new InventoryRepository();
  private readonly customerRepo = new CustomerRepository();
  private readonly supplierRepo = new SupplierRepository();
  private readonly productRepo = new ProductRepository();

  // Orders and incoming order drafts are no longer mock/in-memory data — see
  // src/app/(app)/sales/page.tsx, which reads and writes them directly
  // against the real backend (/api/orders, /api/order-drafts). Invoice's
  // and Shipment's own order joins below were removed for the same reason:
  // they depended on the retired OrderRepository.

  // -------------------------------------------------------------- Invoices
  get invoices(): Invoice[] {
    return this.invoiceRepo.findAll();
  }

  findInvoice(id: string): Invoice | undefined {
    return this.invoiceRepo.findById(id);
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


