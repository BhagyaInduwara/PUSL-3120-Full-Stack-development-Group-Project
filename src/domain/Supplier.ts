import { Entity } from "./Entity";

export interface SupplierProps {
  id: string;
  name: string;
  category: string;
  contact: string;
  leadTime: string;
}

export class Supplier extends Entity {
  readonly name: string;
  readonly category: string;
  readonly contact: string;
  readonly leadTime: string;

  constructor(props: SupplierProps) {
    super(props.id);
    this.name = props.name;
    this.category = props.category;
    this.contact = props.contact;
    this.leadTime = props.leadTime;
  }
}
