import { InMemoryRepository } from "./Repository";
import { Shipment } from "@/domain/Shipment";
import { SHIPMENT_SEED } from "./seed-data";

export class ShipmentRepository extends InMemoryRepository<Shipment> {
  constructor(seed = SHIPMENT_SEED) {
    super(seed.map((props) => new Shipment(props)));
  }

  findByOrderId(orderId: string): Shipment | undefined {
    return this.items.find((shipment) => shipment.orderId === orderId);
  }
}
