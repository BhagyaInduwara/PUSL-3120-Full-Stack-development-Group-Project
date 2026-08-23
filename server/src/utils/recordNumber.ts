import { nextSequence } from "../models/Counter.js";

/**
 * Human-readable record numbers, e.g. "2026/08/23/A001" — replaces raw
 * MongoDB ObjectIds in the UI for Orders/Invoices/Shipments. The counter
 * resets every calendar year (see Counter.ts); within a year, the sequence
 * climbs 1..999 as "A001".."A999", then rolls to "B001", "C001", etc. —
 * a letter costs nothing to add and buys another 999 records, so this
 * comfortably covers far more volume than a 3-digit number alone ever could.
 */

/** 0 -> "A", 25 -> "Z", 26 -> "AA", ... (bijective base-26, same scheme spreadsheet column letters use). */
function toLetters(index: number): string {
  let n = index + 1;
  let letters = "";
  while (n > 0) {
    n--;
    letters = String.fromCharCode(65 + (n % 26)) + letters;
    n = Math.floor(n / 26);
  }
  return letters;
}

function formatRecordNumber(date: Date, seq: number): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const letterIndex = Math.floor((seq - 1) / 999);
  const within = ((seq - 1) % 999) + 1;
  return `${year}/${month}/${day}/${toLetters(letterIndex)}${String(within).padStart(3, "0")}`;
}

/** type is a short tag like "order"/"invoice"/"shipment" — each gets its own yearly sequence. */
export async function generateRecordNumber(type: string, date: Date): Promise<string> {
  const seq = await nextSequence(type, date.getFullYear());
  return formatRecordNumber(date, seq);
}
