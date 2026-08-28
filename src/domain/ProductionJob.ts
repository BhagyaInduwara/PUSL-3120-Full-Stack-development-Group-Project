import { Entity } from "./Entity";

export type JobStatus = "Planned" | "In Progress" | "Completed";

export interface ProductionJobProps {
  id: string;
  /** Human-readable display id, e.g. "2026/08/23/A001" — distinct from `id` (the Mongo ObjectId used for routing/API calls). */
  number: string;
  orderNumber?: string;
  customer?: string;
  product: string;
  qty: number;
  due: string;
  status: JobStatus;
  /** 0-100. Only meaningful while status is "In Progress"; ignored otherwise. */
  progress?: number;
}

export interface ProductionJobEditableFields {
  product: string;
  qty: number;
  due: string;
  orderNumber?: string;
  customer?: string;
}

export class ProductionJob extends Entity {
  readonly number: string;
  readonly orderNumber?: string;
  private _customer?: string;
  private _product: string;
  private _qty: number;
  private _due: string;
  readonly status: JobStatus;
  readonly progress: number;

  constructor(props: ProductionJobProps) {
    super(props.id);
    this.number = props.number;
    this.orderNumber = props.orderNumber;
    this._customer = props.customer;
    this._product = props.product;
    this._qty = props.qty;
    this._due = props.due;
    this.status = props.status;
    this.progress = props.progress ?? 0;
  }

  get customer(): string | undefined {
    return this._customer;
  }

  get product(): string {
    return this._product;
  }

  get qty(): number {
    return this._qty;
  }

  get due(): string {
    return this._due;
  }

  /** ProductionJob has no "Draft" status; "Planned" is its equivalent not-yet-started state, so that's when its scope can still change. */
  get canEdit(): boolean {
    return this.status === "Planned";
  }

  update(patch: Partial<ProductionJobEditableFields>): void {
    if (!this.canEdit) return;
    if (patch.product !== undefined) this._product = patch.product;
    if (patch.qty !== undefined) this._qty = patch.qty;
    if (patch.due !== undefined) this._due = patch.due;
    if (patch.customer !== undefined) this._customer = patch.customer;
  }
}
