import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

// Custom operational error class
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

// 404 handler — mount AFTER all routes
export const notFound = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} does not exist`,
  });
};

// Global error handler — mount LAST (after notFound)
export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const isDev = process.env.NODE_ENV === "development";

  // Our own operational errors (404s, 403s, etc.)
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(isDev && { stack: err.stack }),
    });
    return;
  }

  // Zod validation errors
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: err.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      })),
    });
    return;
  }

  // Prisma known errors
  if (
    typeof err === "object" &&
    err !== null &&
    "code" in err
  ) {
    const prismaErr = err as { code: string; message: string };

    if (prismaErr.code === "P2002") {
      res.status(409).json({
        success: false,
        message: "A record with this unique value already exists.",
      });
      return;
    }

    if (prismaErr.code === "P2025") {
      res.status(404).json({
        success: false,
        message: "Record not found.",
      });
      return;
    }
  }

  // Unexpected errors
  console.error("[Unhandled Error]", err);

  res.status(500).json({
    success: false,
    message: "Internal server error",
    ...(isDev && { error: String(err) }),
  });
};
