import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import restaurantsRouter from "./routes/restaurants.js";
import assignmentsRouter from "./routes/assignments.js";
import stateRouter from "./routes/state.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";

const app = express();
const PORT = process.env.PORT ?? 3001;

// ─── Security headers ─────────────────────────────────────────
app.use(helmet());

// ─── CORS ─────────────────────────────────────────────────────
app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL ?? "http://localhost:3000",
      "http://localhost:3000",
      "http://localhost:3001",
    ],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// ─── Body parsing ─────────────────────────────────────────────
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));

// ─── Request logging (dev only) ───────────────────────────────
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// ─── Rate limiting ────────────────────────────────────────────
// 200 requests per 15 minutes — plenty for one user
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests, please slow down" },
});
app.use("/api", limiter);

// ─────────────────────────────────────────────────────────────
// Health check
// ─────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({
    success: true,
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV ?? "development",
  });
});

// ─────────────────────────────────────────────────────────────
// API Routes
// ─────────────────────────────────────────────────────────────
app.use("/api/restaurants", restaurantsRouter);
app.use("/api/assignments", assignmentsRouter);
app.use("/api/state", stateRouter);

// ─────────────────────────────────────────────────────────────
// 404 + global error handler (must come LAST)
// ─────────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─────────────────────────────────────────────────────────────
// Start
// ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n💕 Valentine Backend is running!`);
  console.log(`   Local:   http://localhost:${PORT}`);
  console.log(`   Health:  http://localhost:${PORT}/health`);
  console.log(`   Env:     ${process.env.NODE_ENV ?? "development"}\n`);
});

export default app;
