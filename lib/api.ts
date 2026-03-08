/**
 * ─────────────────────────────────────────────────────────────
 * Frontend API Client
 *
 * SETUP:
 *   1. Copy this file into your Next.js project at: lib/api.ts
 *   2. Add to your Next.js .env.local:
 *        NEXT_PUBLIC_API_URL=http://localhost:3001/api
 *
 * USAGE:
 *   import { api } from "@/lib/api"
 *   const restaurants = await api.restaurants.getAll()
 * ─────────────────────────────────────────────────────────────
 */

import type { Restaurant, DateAssignment } from "./types";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

// ─── Generic typed fetch wrapper ─────────────────────────────

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });

  const json = await res.json();

  if (!res.ok || !json.success) {
    throw new Error(json.message ?? "API request failed");
  }

  return json.data as T;
}

// ─────────────────────────────────────────────────────────────
// RESTAURANTS
// ─────────────────────────────────────────────────────────────

export const restaurantsApi = {
  /** Fetch all restaurants (default + custom). Replace your static import. */
  getAll: () => request<Restaurant[]>("/restaurants"),

  /** Create a custom restaurant from the form modal */
  create: (data: { name: string; image?: string; cuisine?: string }) =>
    request<Restaurant>("/restaurants", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  /** Delete a custom restaurant */
  delete: (id: string) =>
    request<void>(`/restaurants/${id}`, { method: "DELETE" }),
};

// ─────────────────────────────────────────────────────────────
// DATE ASSIGNMENTS
// ─────────────────────────────────────────────────────────────

export const assignmentsApi = {
  /**
   * Fetch all assignments as a flat map: { "2025-03-14": Restaurant }
   * Load this on mount and put it directly in useState<DateAssignment>
   */
  getAll: () => request<DateAssignment>("/assignments"),

  /**
   * Assign a restaurant to a date (overwrites existing if occupied).
   * Call this AFTER updating local state in handleDragEnd.
   */
  assign: (dateKey: string, restaurantId: string) =>
    request("/assignments", {
      method: "POST",
      body: JSON.stringify({ dateKey, restaurantId }),
    }),

  /**
   * Remove a restaurant from a specific date.
   * Call this AFTER updating local state in handleRemove.
   */
  remove: (dateKey: string) =>
    request(`/assignments/${encodeURIComponent(dateKey)}`, {
      method: "DELETE",
    }),

  /** Clear all assignments (full reset) */
  clearAll: () => request("/assignments", { method: "DELETE" }),
};

// ─────────────────────────────────────────────────────────────
// APP STATE
// ─────────────────────────────────────────────────────────────

export const stateApi = {
  /** Fetch app state — call on mount to restore proposalAccepted */
  get: () =>
    request<{ id: string; proposalAccepted: boolean; updatedAt: string }>(
      "/state"
    ),

  /** Mark proposal as accepted — call when she clicks "Yes 💕" */
  setProposalAccepted: (accepted: boolean) =>
    request("/state", {
      method: "PATCH",
      body: JSON.stringify({ proposalAccepted: accepted }),
    }),
};

// ─── Single export ────────────────────────────────────────────
export const api = {
  restaurants: restaurantsApi,
  assignments: assignmentsApi,
  state: stateApi,
};
