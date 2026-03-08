import { Router, Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../middleware/errorHandler.js";
import { assignRestaurantSchema, bulkAssignSchema } from "../lib/validators.js";

const router = Router();

// ─────────────────────────────────────────────────────────────
// GET /api/assignments
// Returns a flat map: { "2025-03-14": { ...restaurant }, ... }
// This matches exactly what the frontend stores in useState<DateAssignment>
// ─────────────────────────────────────────────────────────────
router.get("/", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const assignments = await prisma.dateAssignment.findMany({
      include: { restaurant: true },
      orderBy: { dateKey: "asc" },
    });

    // Transform array → flat map for direct frontend use
    const assignmentMap: Record<string, object> = {};
    for (const a of assignments) {
      assignmentMap[a.dateKey] = a.restaurant;
    }

    res.json({
      success: true,
      data: assignmentMap,
      count: assignments.length,
    });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/assignments/list
// Returns full assignment rows as an array (useful for summary section)
// ─────────────────────────────────────────────────────────────
router.get(
  "/list",
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const assignments = await prisma.dateAssignment.findMany({
        include: { restaurant: true },
        orderBy: { dateKey: "asc" },
      });

      res.json({
        success: true,
        data: assignments,
        count: assignments.length,
      });
    } catch (err) {
      next(err);
    }
  },
);

// ─────────────────────────────────────────────────────────────
// POST /api/assignments
// Assign a restaurant to a date — upsert so dragging a new
// restaurant onto an occupied date overwrites it (same as frontend)
// Body: { dateKey: "2025-03-14", restaurantId: "r1" }
// ─────────────────────────────────────────────────────────────
router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = assignRestaurantSchema.parse(req.body);

    // Make sure the restaurant exists
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: body.restaurantId },
    });
    if (!restaurant) throw new AppError("Restaurant not found", 404);

    // Upsert — if this dateKey already has a restaurant, replace it
    const assignment = await prisma.dateAssignment.upsert({
      where: { dateKey: body.dateKey },
      update: { restaurantId: body.restaurantId },
      create: { dateKey: body.dateKey, restaurantId: body.restaurantId },
      include: { restaurant: true },
    });

    res.status(201).json({
      success: true,
      data: assignment,
      message: `"${restaurant.name}" assigned to ${body.dateKey}`,
    });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/assignments/bulk
// Save multiple assignments in one request (inside a transaction).
// Use this to sync the full frontend state to DB in one shot.
// Body: { assignments: [{ dateKey, restaurantId }, ...] }
// ─────────────────────────────────────────────────────────────
router.post(
  "/bulk",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = bulkAssignSchema.parse(req.body);

      // Verify all restaurants exist first
      const uniqueIds = [
        ...new Set(body.assignments.map((a) => a.restaurantId)),
      ];
      const found = await prisma.restaurant.findMany({
        where: { id: { in: uniqueIds } },
        select: { id: true },
      });
      const foundSet = new Set(found.map((r: { id: string }) => r.id));
      const missing = uniqueIds.filter((id) => !foundSet.has(id));

      if (missing.length > 0) {
        throw new AppError(`Restaurants not found: ${missing.join(", ")}`, 404);
      }

      // Upsert all assignments in a single atomic transaction
      const results = await prisma.$transaction(
        body.assignments.map((a) =>
          prisma.dateAssignment.upsert({
            where: { dateKey: a.dateKey },
            update: { restaurantId: a.restaurantId },
            create: { dateKey: a.dateKey, restaurantId: a.restaurantId },
            include: { restaurant: true },
          }),
        ),
      );

      res.status(201).json({
        success: true,
        data: results,
        count: results.length,
        message: `${results.length} assignments saved`,
      });
    } catch (err) {
      next(err);
    }
  },
);

// ─────────────────────────────────────────────────────────────
// DELETE /api/assignments/:dateKey
// Remove the restaurant from a specific date
// Called when user clicks the X button on a date card
// dateKey example: "2025-03-14"
// ─────────────────────────────────────────────────────────────
router.delete(
  "/:dateKey",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { dateKey } = req.params;
      const dateKeyStr = Array.isArray(dateKey) ? dateKey[0] : dateKey;

      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKeyStr)) {
        throw new AppError("dateKey must be YYYY-MM-DD format", 400);
      }

      const existing = await prisma.dateAssignment.findUnique({
        where: { dateKey: dateKeyStr },
      });
      if (!existing)
        throw new AppError(`No assignment found for ${dateKey}`, 404);

      await prisma.dateAssignment.delete({ where: { dateKey: dateKeyStr } });

      res.json({
        success: true,
        message: `Assignment for ${dateKeyStr} removed`,
      });
    } catch (err) {
      next(err);
    }
  },
);

// ─────────────────────────────────────────────────────────────
// DELETE /api/assignments
// Wipe ALL assignments — full reset / start over
// ─────────────────────────────────────────────────────────────
router.delete("/", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const deleted = await prisma.dateAssignment.deleteMany({});
    res.json({
      success: true,
      count: deleted.count,
      message: `All ${deleted.count} assignments cleared`,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
