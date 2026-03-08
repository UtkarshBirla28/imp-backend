import { Router, Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../middleware/errorHandler.js";
import {
  createRestaurantSchema,
  updateRestaurantSchema,
} from "../lib/validators.js";

const router = Router();

// ─────────────────────────────────────────────────────────────
// GET /api/restaurants
// Returns all restaurants ordered: defaults first, then custom
// ─────────────────────────────────────────────────────────────
router.get("/", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurants = await prisma.restaurant.findMany({
      orderBy: [{ isCustom: "asc" }, { createdAt: "asc" }],
    });

    res.json({
      success: true,
      data: restaurants,
      count: restaurants.length,
    });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/restaurants/:id
// Returns a single restaurant by ID including its assignments
// ─────────────────────────────────────────────────────────────
router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: req.params.id as string },
      include: {
        assignments: {
          orderBy: { dateKey: "asc" },
        },
      },
    });

    if (!restaurant) {
      throw new AppError("Restaurant not found", 404);
    }

    res.json({ success: true, data: restaurant });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/restaurants
// Create a new custom restaurant (called from the form modal)
// Body: { name, image?, cuisine? }
// ─────────────────────────────────────────────────────────────
router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = createRestaurantSchema.parse(req.body);

    const restaurant = await prisma.restaurant.create({
      data: {
        name: body.name,
        image: body.image,
        cuisine: body.cuisine,
        isCustom: true, // form-created restaurants are always custom
      },
    });

    res.status(201).json({
      success: true,
      data: restaurant,
      message: `Restaurant "${restaurant.name}" created`,
    });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────
// PUT /api/restaurants/:id
// Update a custom restaurant's details
// Only custom restaurants can be edited
// ─────────────────────────────────────────────────────────────
router.put("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = updateRestaurantSchema.parse(req.body);

    const existing = await prisma.restaurant.findUnique({
      where: { id: req.params.id as string },
    });

    if (!existing) throw new AppError("Restaurant not found", 404);
    if (!existing.isCustom)
      throw new AppError("Cannot edit default restaurants", 403);

    const updated = await prisma.restaurant.update({
      where: { id: req.params.id as string },
      data: body,
    });

    res.json({ success: true, data: updated, message: "Restaurant updated" });
  } catch (err) {
    next(err);
  }
});

export default router;
