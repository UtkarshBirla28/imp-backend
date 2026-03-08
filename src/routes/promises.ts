import { Router, Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../middleware/errorHandler.js";
import { z } from "zod";

const router = Router();

const createPromiseSchema = z.object({
  text: z.string({ required_error: "text is required" }).min(1).max(500).trim(),
});

const updatePromiseSchema = z.object({
  completed: z.boolean().optional(),
  text: z.string().min(1).max(500).trim().optional(),
}).refine(
  (d) => d.completed !== undefined || d.text !== undefined,
  { message: "Must provide at least one of: completed, text" }
);

// GET /api/promises — all promises, defaults first
router.get("/", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const promises = await prisma.promise.findMany({
      orderBy: [{ isCustom: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
    });
    res.json({ success: true, data: promises, count: promises.length });
  } catch (err) { next(err); }
});

// POST /api/promises — create custom promise
router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = createPromiseSchema.parse(req.body);
    const promise = await prisma.promise.create({
      data: { text: body.text, completed: false, isCustom: true, sortOrder: 0 },
    });
    res.status(201).json({ success: true, data: promise, message: "Promise created" });
  } catch (err) { next(err); }
});

// PATCH /api/promises/:id — toggle completed or update text
router.patch("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = updatePromiseSchema.parse(req.body);
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const existing = await prisma.promise.findUnique({ where: { id } });
    if (!existing) throw new AppError("Promise not found", 404);

    const updated = await prisma.promise.update({
      where: { id },
      data: {
        ...(body.completed !== undefined && { completed: body.completed }),
        ...(body.text !== undefined && { text: body.text }),
      },
    });
    res.json({ success: true, data: updated, message: "Promise updated" });
  } catch (err) { next(err); }
});

// DELETE /api/promises/:id — custom promises only
router.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const existing = await prisma.promise.findUnique({ where: { id } });
    if (!existing) throw new AppError("Promise not found", 404);
    if (!existing.isCustom) throw new AppError("Cannot delete default promises", 403);

    await prisma.promise.delete({ where: { id } });
    res.json({ success: true, message: "Promise deleted" });
  } catch (err) { next(err); }
});

export default router;