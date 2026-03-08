// ─────────────────────────────────────────────
// Global Error Handler Middleware
// ─────────────────────────────────────────────
import { Request, Response, NextFunction } from "express";
import { AppError, ValidationError } from "../utils/errors";
import { env } from "../config/env";

export function errorHandler(
    err: Error,
    _req: Request,
    res: Response,
    _next: NextFunction,
): void {
    // Known operational errors
    if (err instanceof ValidationError) {
        res.status(err.statusCode).json({
            error: err.message,
            details: err.details,
        });
        return;
    }

    if (err instanceof AppError) {
        res.status(err.statusCode).json({
            error: err.message,
        });
        return;
    }

    // Unknown / programmer errors
    console.error("💥 Unexpected error:", err);

    res.status(500).json({
        error:
            env.NODE_ENV === "production"
                ? "Internal server error"
                : err.message || "Internal server error",
    });
}
