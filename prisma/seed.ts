/**
 * Database seed script
 * Run: npm run db:seed
 *
 * Safe to run multiple times — uses upsert so no duplicate data.
 */

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// These match your existing data.ts exactly
const defaultRestaurants = [
  {
    id: "r1",
    name: "Madouk",
    image:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop",
    cuisine: "Chinese and Thai",
  },
  {
    id: "r2",
    name: "Black Jack",
    image:
      "https://images.unsplash.com/photo-1579027989536-b7b1f875659b?w=400&h=300&fit=crop",
    cuisine: "American",
  },
  {
    id: "r3",
    name: "Movie",
    image:
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=300&fit=crop",
    cuisine: "Entertainment",
  },
  {
    id: "r4",
    name: "Sushi",
    image:
      "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=400&h=300&fit=crop",
    cuisine: "Japanese",
  },
  {
    id: "r5",
    name: "Chidiya ghar",
    image:
      "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=400&h=300&fit=crop",
    cuisine: "Fun",
  },
  {
    id: "r6",
    name: "Night Walk",
    image:
      "https://images.unsplash.com/photo-1590846406792-0adc7f938f1d?w=400&h=300&fit=crop",
    cuisine: "Romantic?",
  },
  {
    id: "r7",
    name: "Coffee",
    image:
      "https://images.unsplash.com/photo-1600891964599-f61ba0e24092?w=400&h=300&fit=crop",
    cuisine: "Cozy",
  },
  {
    id: "r8",
    name: "Watermelon Roll",
    image:
      "https://images.unsplash.com/photo-1592861956120-e524fc739696?w=400&h=300&fit=crop",
    cuisine: "Something new",
  },
  {
    id: "r9",
    name: "Ground Baking",
    image:
      "https://images.unsplash.com/photo-1544148103-0773bf10d330?w=400&h=300&fit=crop",
    cuisine: "Italian",
  },
];

async function main() {
  console.log("🌱 Seeding database...\n");

  // Upsert each default restaurant — safe to re-run
  for (const r of defaultRestaurants) {
    await prisma.restaurant.upsert({
      where: { id: r.id },
      update: {
        name: r.name,
        image: r.image,
        cuisine: r.cuisine,
        isCustom: false,
      },
      create: {
        id: r.id,
        name: r.name,
        image: r.image,
        cuisine: r.cuisine,
        isCustom: false,
      },
    });
    console.log(`  ✅ ${r.name}`);
  }

  // Ensure the singleton AppState row exists
  await prisma.appState.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton", proposalAccepted: false },
  });
  console.log("\n  ✅ App state initialized");

  console.log("\n🎉 Seed complete!");
}

main()
  .catch((e) => {
    console.error("\n❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
