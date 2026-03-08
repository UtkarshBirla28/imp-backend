import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const defaultRestaurants = [
  { id: "r1", name: "Madouk",          image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop", cuisine: "Chinese and Thai" },
  { id: "r2", name: "Black Jack",      image: "https://images.unsplash.com/photo-1579027989536-b7b1f875659b?w=400&h=300&fit=crop", cuisine: "American" },
  { id: "r3", name: "Movie",           image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=300&fit=crop", cuisine: "Entertainment" },
  { id: "r4", name: "Sushi",           image: "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=400&h=300&fit=crop", cuisine: "Japanese" },
  { id: "r5", name: "Chidiya ghar",    image: "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=400&h=300&fit=crop", cuisine: "Fun" },
  { id: "r6", name: "Night Walk",      image: "https://images.unsplash.com/photo-1590846406792-0adc7f938f1d?w=400&h=300&fit=crop", cuisine: "Romantic?" },
  { id: "r7", name: "Coffee",          image: "https://images.unsplash.com/photo-1600891964599-f61ba0e24092?w=400&h=300&fit=crop", cuisine: "Cozy" },
  { id: "r8", name: "Watermelon Roll", image: "https://images.unsplash.com/photo-1592861956120-e524fc739696?w=400&h=300&fit=crop", cuisine: "Something new" },
  { id: "r9", name: "Ground Baking",   image: "https://images.unsplash.com/photo-1544148103-0773bf10d330?w=400&h=300&fit=crop", cuisine: "Italian" },
];

const defaultPromises = [
  { id: "p1", text: "I won't say bad thing's to Ekta",                                                             sortOrder: 1 },
  { id: "p2", text: "I will never disrespect her or hurt her feelings",                                            sortOrder: 2 },
  { id: "p3", text: "I will understand your silence",                                                              sortOrder: 3 },
  { id: "p4", text: "I will patient with you, i will wait for you",                                                sortOrder: 4 },
  { id: "p5", text: "I will always love you",                                                                      sortOrder: 5 },
  { id: "p6", text: "I will never bring anything from past",                                                       sortOrder: 6 },
  { id: "p7", text: "We will have our own home where i will make a beautiful garden for you, full of flowers",     sortOrder: 7 },
];

async function main() {
  console.log("🌱 Seeding...\n");

  for (const r of defaultRestaurants) {
    await prisma.restaurant.upsert({
      where: { id: r.id },
      update: { name: r.name, image: r.image, cuisine: r.cuisine, isCustom: false },
      create: { id: r.id, name: r.name, image: r.image, cuisine: r.cuisine, isCustom: false },
    });
    console.log(`  ✅ Restaurant: ${r.name}`);
  }

  for (const p of defaultPromises) {
    await prisma.promise.upsert({
      where: { id: p.id },
      update: { text: p.text, isCustom: false, sortOrder: p.sortOrder },
      create: { id: p.id, text: p.text, completed: false, isCustom: false, sortOrder: p.sortOrder },
    });
    console.log(`  ✅ Promise: ${p.text.slice(0, 45)}...`);
  }

  await prisma.appState.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton", proposalAccepted: false },
  });
  console.log("\n  ✅ App state initialized\n🎉 Done!");
}

main()
  .catch((e) => { console.error("❌ Seed failed:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());