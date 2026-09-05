import { Observable } from "./Observable";
import {
  InvoiceRepository,
  InventoryRepository,
  CustomerRepository,
  SupplierRepository,
  ProductRepository,
} from "@/repositories";
import { ACTIVITY_FEED_SEED, REVENUE_SERIES_SEED } from "@/repositories/seed-data";
import type { Invoice, InvoiceEditableFields } from "@/domain/Invoice";
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
  private readonly inventoryRepo = new InventoryRepository();
  private readonly customerRepo = new CustomerRepository();
  private readonly supplierRepo = new SupplierRepository();
  private readonly productRepo = new ProductRepository();

  // Orders, incoming drafts, shipments, and production jobs are no longer
  // mock/in-memory data — see sales/page.tsx, shipments/page.tsx, and
  // production/page.tsx, which read and write them directly against the
  // real backend (/api/orders, /api/shipments, /api/production-jobs). The
  // ShipmentRepository and ProductionJobRepository were retired alongside
  // this change.

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

  /** Jobs planned or in progress — now computed by the dashboard page from
   *  its own API fetch; this getter is kept as a zero-stub so nothing breaks. */
  get inProductionCount(): number {
    return 0;
  }

  get lowStockCount(): number {
    return this.inventory.filter((i) => i.isLow).length;
  }
}


