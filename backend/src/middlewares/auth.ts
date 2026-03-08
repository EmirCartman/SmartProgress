// ─────────────────────────────────────────────
// JWT Authentication Middleware
// ─────────────────────────────────────────────
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { UnauthorizedError } from "../utils/errors";

export interface JwtPayload {
    userId: string;
    role: string;
}

// Extend Express Request to include user information
declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload;
        }
    }
}

export function authenticate(
    req: Request,
    _res: Response,
    next: NextFunction,
): void {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            throw new UnauthorizedError("Missing or invalid authorization header");
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

        req.user = decoded;
        next();
    } catch (error) {
        console.error("[Auth Middleware] JWT Hatası:", error);
        if (error instanceof UnauthorizedError) {
            next(error);
            return;
        }
        next(new UnauthorizedError("Invalid or expired token"));
    }
}
