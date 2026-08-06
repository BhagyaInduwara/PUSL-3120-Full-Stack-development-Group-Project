import { InMemoryRepository } from "./Repository";
import { ProductionJob, type JobStatus } from "@/domain/ProductionJob";
import { JOB_SEED } from "./seed-data";

export class ProductionJobRepository extends InMemoryRepository<ProductionJob> {
  constructor(seed = JOB_SEED) {
    super(seed.map((props) => new ProductionJob(props)));
  }

  findByStatus(status: JobStatus): ProductionJob[] {
    return this.items.filter((job) => job.status === status);
  }
}
