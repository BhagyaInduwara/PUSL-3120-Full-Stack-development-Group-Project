import { Entity } from "./Entity";

export type JobStatus = "Planned" | "In Progress" | "Completed";

export interface ProductionJobProps {
  id: string;
  product: string;
  qty: number;
  due: string;
  status: JobStatus;
  /** 0-100. Only meaningful while status is "In Progress"; ignored otherwise. */
  progress?: number;
}

export class ProductionJob extends Entity {
  readonly product: string;
  readonly qty: number;
  readonly due: string;
  readonly status: JobStatus;
  readonly progress: number;

  constructor(props: ProductionJobProps) {
    super(props.id);
    this.product = props.product;
    this.qty = props.qty;
    this.due = props.due;
    this.status = props.status;
    this.progress = props.progress ?? 0;
  }
}
