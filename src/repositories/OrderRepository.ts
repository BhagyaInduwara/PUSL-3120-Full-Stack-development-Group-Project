import { InMemoryRepository } from "./Repository";
import { Order, type OrderStatus } from "@/domain/Order";
import { ORDER_SEED } from "./seed-data";

export class OrderRepository extends InMemoryRepository<Order> {
  constructor(seed = ORDER_SEED) {
    super(seed.map((props) => new Order(props)));
  }

  findByStatus(status: OrderStatus): Order[] {
    return this.items.filter((order) => order.status === status);
  }

  /** Moves an order to a new status in place (mutates the shared Order instance). */
  moveStatus(orderId: string, status: OrderStatus): void {
    this.findById(orderId)?.moveTo(status);
  }

  add(order: Order): void {
    this.items.push(order);
  }

  nextId(): string {
    const numbers = this.items.map((o) => Number(o.id.replace("ORD-", "")) || 0);
    return `ORD-${Math.max(0, ...numbers) + 1}`;
  }
}
