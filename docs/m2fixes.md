# Milestone 2 Fixes & Enhancements

- **Added Stage View Toggle Button:** Added a `Stages` toggle button directly to the left of the `Board | Table` control on the Sales & Orders page header, allowing users to toggle between detailed pipeline cards and compact cards.
- **Preserved Table & Detail Dialog Views:** Maintained the "Pipeline Stage" column in Table view and the detailed 4-stage pipeline stepper in the Order Details modal.
- **Aligned Pipeline Progression with Milestone Transitions:** Configured `OrderStageTracker` to follow progressive milestone completion (Draft: 0 done, Confirmed: 1 done [Order ✅], Invoiced: 3 done [Order ✅, Prod ✅, Invoice ✅] with Shipment marked as "Ready to Ship", Shipped: 3 done [In Transit], Closed: 4 done [All ✅]).
