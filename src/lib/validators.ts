import { z } from "zod";

// ─── Restaurants ──────────────────────────────────────────────

export const createRestaurantSchema = z.object({
  name: z
    .string({ required_error: "name is required" })
    .min(1, "name cannot be empty")
    .max(100, "name too long")
    .trim(),
  image: z
    .string()
    .url("image must be a valid URL")
    .optional()
    .default("/indian-food-default.jpg"),
  cuisine: z
    .string()
    .min(1, "cuisine cannot be empty")
    .max(50, "cuisine too long")
    .trim()
    .optional()
    .default("Indian"),
  isCustom: z.boolean().optional().default(true),
});

export const updateRestaurantSchema = z.object({
  name: z.string().min(1).max(100).trim().optional(),
  image: z.string().url().optional(),
  cuisine: z.string().min(1).max(50).trim().optional(),
});

// ─── Date Assignments ─────────────────────────────────────────

// dateKey must be ISO date: "2025-03-14"
const dateKeySchema = z
  .string({ required_error: "dateKey is required" })
  .regex(/^\d{4}-\d{2}-\d{2}$/, "dateKey must be YYYY-MM-DD format");

export const assignRestaurantSchema = z.object({
  dateKey: dateKeySchema,
  restaurantId: z
    .string({ required_error: "restaurantId is required" })
    .min(1, "restaurantId cannot be empty"),
});

export const bulkAssignSchema = z.object({
  assignments: z
    .array(
      z.object({
        dateKey: dateKeySchema,
        restaurantId: z.string().min(1),
      })
    )
    .min(1, "Must provide at least one assignment")
    .max(31, "Cannot assign more than 31 dates at once"),
});

// ─── App State ────────────────────────────────────────────────

export const updateAppStateSchema = z.object({
  proposalAccepted: z.boolean({
    required_error: "proposalAccepted is required",
  }),
});

// ─── Inferred types ───────────────────────────────────────────

export type CreateRestaurantInput = z.infer<typeof createRestaurantSchema>;
export type UpdateRestaurantInput = z.infer<typeof updateRestaurantSchema>;
export type AssignRestaurantInput = z.infer<typeof assignRestaurantSchema>;
export type BulkAssignInput = z.infer<typeof bulkAssignSchema>;
export type UpdateAppStateInput = z.infer<typeof updateAppStateSchema>;
