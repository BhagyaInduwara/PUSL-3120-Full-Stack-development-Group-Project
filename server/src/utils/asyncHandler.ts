import type { NextFunction, Request, RequestHandler, Response } from "express";

/**
 * Express 4 does NOT forward a rejected promise from an async handler to
 * the error middleware on its own (that's an Express 5 behavior) — an
 * unawaited rejection here would just hang the request. Wrapping every
 * async controller with this catches the rejection and calls next(err),
 * so app.ts's centralized error handler actually receives it.
 */
export function asyncHandler(handler: (req: Request, res: Response, next: NextFunction) => Promise<void>): RequestHandler {
  return (req, res, next) => {
    handler(req, res, next).catch(next);
  };
}
