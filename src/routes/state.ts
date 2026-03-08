import { Router, Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma.js";
import { updateAppStateSchema } from "../lib/validators.js";

const router = Router();

// Helper: ensure the singleton row exists, create it if not
async function getOrCreateState() {
  return prisma.appState.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton", proposalAccepted: false },
  });
}

// ─────────────────────────────────────────────────────────────
// GET /api/state
// Returns the current app state.
// Frontend calls this on load to check if proposal was accepted.
// ─────────────────────────────────────────────────────────────
router.get("/", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const state = await getOrCreateState();
    res.json({ success: true, data: state });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────
// PATCH /api/state
// Update app state — called when she clicks "Yes 💕"
// Body: { proposalAccepted: true }
// ─────────────────────────────────────────────────────────────
router.patch("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = updateAppStateSchema.parse(req.body);

    const updated = await prisma.appState.upsert({
      where: { id: "singleton" },
      update: { proposalAccepted: body.proposalAccepted },
      create: { id: "singleton", proposalAccepted: body.proposalAccepted },
    });

    res.json({ success: true, data: updated, message: "State updated" });
  } catch (err) {
    next(err);
  }
});

export default router;
