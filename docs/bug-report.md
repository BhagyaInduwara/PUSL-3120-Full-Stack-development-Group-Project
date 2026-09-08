# Bug Report — Delivered shipments could still be edited via the API

**Found during:** M4 test development (writing Jest + Supertest integration
tests for the backend, `server/src/__tests__/`).
**Severity:** Medium — a data-integrity issue, not a crash. No user-facing
error occurred; the API silently accepted an edit it should have rejected.
**Status:** Fixed.

## Summary

`PUT /api/shipments/:id` would successfully update a shipment's `date` and
`status` even after that shipment had already reached the `"Delivered"`
status — the final stage of its lifecycle. A finalized delivery record
could be silently rewritten by any authenticated caller, including via a
direct API call (curl, Postman, or a buggy client) that never goes through
the app's own UI.

## Root cause

The Next.js frontend's domain class,
[`src/domain/Shipment.ts`](../src/domain/Shipment.ts), already documents
and enforces this rule — its own doc comment reads:

```ts
/** Delivered shipments are finalized and cannot be modified. */
get canEdit(): boolean {
  return this._status !== "Delivered";
}
```

`canEdit` gates the **Edit** button in `ShipmentDetailDialog`, so the rule
holds for anyone using the app's UI. But that check only ever ran
client-side. The backend's `updateShipment` controller
([`server/src/controllers/shipment.controller.ts`](../server/src/controllers/shipment.controller.ts))
validated `orderId`/`invoiceId`/`status` shape and format, but never
checked the shipment's *current* status before applying the update — so
the invariant the domain class documents was never actually enforced where
it mattered: the API that any client ultimately has to go through. A
hidden button in one UI is not the same thing as a rule the system
actually enforces.

## Regression test (written first, confirmed failing before the fix)

[`server/src/__tests__/shipment.test.ts`](../server/src/__tests__/shipment.test.ts)
creates a real `Order` and a `Shipment` with `status: "Delivered"` against
an in-memory MongoDB instance, then sends `PUT /api/shipments/:id` trying
to change its `date` and `status`. Before the fix this returned `200` and
the change was applied; the test asserted `409` and no change, so it
failed exactly as expected:

```
Expected: 409
Received: 200
```

A second test in the same file confirms the fix doesn't over-correct — a
non-Delivered shipment (`"Packed"`) can still be updated normally.

## Fix

`updateShipment` now fetches the existing shipment first and rejects the
request with `409 Conflict` (with the message *"This shipment has already
been delivered and can no longer be modified."*) if its status is already
`"Delivered"`, before any of the existing field validation or the actual
update runs:

```ts
export async function updateShipment(req: Request, res: Response): Promise<void> {
  const existing = await Shipment.findById(req.params.id);
  if (!existing) {
    res.status(404).json({ error: "Shipment not found." });
    return;
  }
  if (existing.status === "Delivered") {
    res.status(409).json({ error: "This shipment has already been delivered and can no longer be modified." });
    return;
  }
  // ...existing validation and update logic, unchanged...
}
```

`409 Conflict` was chosen to match the status code this backend already
uses elsewhere for "the request is well-formed, but the resource's current
state makes it impossible" (e.g. a duplicate `Product.sku` or duplicate
`username`).

## Verification

- `server/src/__tests__/shipment.test.ts` — both tests pass after the fix
  (`npm test` inside `server/`, 13/13 across the full suite).
- `tsc --noEmit` and `npm run build` both clean in `/server`.

## Known related gap (not fixed here, flagged for a follow-up)

The same pattern — a domain class documenting an immutability rule that
only the frontend enforces — also exists for `ProductionJob`: its status
state machine says a `"Completed"` job is "Fully read-only," but
`PUT /api/production-jobs/:id` has no equivalent server-side check. Worth
a follow-up fix and test using the same approach as this one.
