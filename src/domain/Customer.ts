import { Entity } from "./Entity";

export interface CustomerProps {
  id: string;
  name: string;
  contact: string;
  email: string;
  city: string;
}

export class Customer extends Entity {
  readonly name: string;
  readonly contact: string;
  readonly email: string;
  readonly city: string;

  constructor(props: CustomerProps) {
    super(props.id);
    this.name = props.name;
    this.contact = props.contact;
    this.email = props.email;
    this.city = props.city;
  }
}
