import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { env } from "./config/env.js";
import { authRouter } from "./routes/auth.routes.js";
import { userRouter } from "./routes/user.routes.js";
import { customerRouter } from "./routes/customer.routes.js";
import { supplierRouter } from "./routes/supplier.routes.js";
import { productRouter } from "./routes/product.routes.js";
import inventoryRouter from "./routes/inventory.routes.js";
import productionJobRouter from "./routes/productionJob.routes.js";
import { activityRouter, revenueSeriesRouter } from "./routes/dashboard.routes.js";
import { invoiceRouter } from "./routes/invoice.routes.js";
import { shipmentRouter } from "./routes/shipment.routes.js";
import { orderRouter } from "./routes/order.routes.js";
import { orderDraftRouter } from "./routes/orderDraft.routes.js";

export const app = express();

app.use(cors({ origin: env.clientOrigin, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);
app.use("/api/customers", customerRouter);
app.use("/api/suppliers", supplierRouter);
app.use("/api/products", productRouter);
app.use("/api/inventory", inventoryRouter);
app.use("/api/production-jobs", productionJobRouter);
app.use("/api/activity", activityRouter);
app.use("/api/revenue-series", revenueSeriesRouter);
app.use("/api/invoices", invoiceRouter);
app.use("/api/shipments", shipmentRouter);
app.use("/api/orders", orderRouter);
app.use("/api/order-drafts", orderDraftRouter);

// Centralized error handler — anything a controller throws (including a
// rejected Mongoose promise not caught locally) lands here instead of
// crashing the process or hanging the request.
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Something went wrong." });
});
