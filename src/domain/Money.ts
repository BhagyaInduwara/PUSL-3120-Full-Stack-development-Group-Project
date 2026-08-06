/**
 * Money — immutable value object wrapping a US-dollar amount as integer
 * cents, so arithmetic never accumulates floating-point error. Every price
 * and total in the app flows through this class instead of raw numbers.
 */
export class Money {
  private readonly cents: number;

  constructor(dollars: number) {
    this.cents = Math.round(dollars * 100);
  }

  static zero(): Money {
    return new Money(0);
  }

  static fromCents(cents: number): Money {
    return new Money(cents / 100);
  }

  get dollars(): number {
    return this.cents / 100;
  }

  add(other: Money): Money {
    return Money.fromCents(this.cents + other.cents);
  }

  multiply(factor: number): Money {
    return Money.fromCents(Math.round(this.cents * factor));
  }

  format(): string {
    return `$${this.dollars.toLocaleString("en-US")}`;
  }
}
