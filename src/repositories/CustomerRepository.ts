import { InMemoryRepository } from "./Repository";
import { Customer, type CustomerProps } from "@/domain/Customer";
import { CUSTOMER_SEED } from "./seed-data";

/**
 * @deprecated Decommissioned in Milestone 3 (Member 6 scope).
 * Customer master data is persisted and queried via MongoDB Atlas at /api/customers.
 */
export class CustomerRepository extends InMemoryRepository<Customer> {
  private nextSeq = this.items.length + 1;

  constructor(seed = CUSTOMER_SEED) {
    super(seed.map((props) => new Customer(props)));
  }

  add(props: Omit<CustomerProps, "id">): Customer {
    const customer = new Customer({ id: `cust-${this.nextSeq++}`, ...props });
    this.items.push(customer);
    return customer;
  }
}
