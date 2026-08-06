import { InMemoryRepository } from "./Repository";
import { Invoice } from "@/domain/Invoice";
import { INVOICE_SEED } from "./seed-data";

export class InvoiceRepository extends InMemoryRepository<Invoice> {
  constructor(seed = INVOICE_SEED) {
    super(seed.map((props) => new Invoice(props)));
  }

  findByOrderId(orderId: string): Invoice | undefined {
    return this.items.find((invoice) => invoice.orderId === orderId);
  }
}
