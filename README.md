

**Stack:** Node.js · Express · Prisma v7 · Neon DB (PostgreSQL)

---

## 🗂️ Project Structure

```
valentine-backend/
├── prisma/
│   ├── schema.prisma          ← DB models
│   └── seed.ts                ← Seeds 12 default restaurants
├── src/
│   ├── index.ts               ← Express server entry
│   ├── lib/
│   │   ├── prisma.ts          ← Prisma Client (with pg adapter)
│   │   └── validators.ts      ← Zod request validation
│   ├── middleware/
│   │   └── errorHandler.ts    ← Global error handler
│   └── routes/
│       ├── restaurants.ts     ← CRUD for restaurants
│       ├── assignments.ts     ← Date assignments (drag-drop)
│       └── state.ts           ← App state (proposal accepted)
├── lib/
│   └── api.ts                 ← ⬅ Copy this to your Next.js project
├── prisma.config.ts           ← Prisma v7 config file
├── .env.example               ← Environment variable template
└── package.json
```

---

## 🗄️ Database Schema

```
┌──────────────────────┐     ┌─────────────────────────────┐
│     restaurants      │     │       date_assignments       │
├──────────────────────┤     ├─────────────────────────────┤
│ id        (cuid, PK) │◄────│ id            (cuid, PK)    │
│ name                 │     │ dateKey       (UNIQUE)       │
│ image                │     │ restaurantId  (FK)           │
│ cuisine              │     │ assignedAt                   │
│ isCustom             │     │ updatedAt                    │
│ createdAt            │     └─────────────────────────────┘
│ updatedAt            │
└──────────────────────┘

┌──────────────────────┐
│       app_state      │
├──────────────────────┤
│ id = "singleton"     │  ← always exactly one row
│ proposalAccepted     │
│ updatedAt            │
└──────────────────────┘
```

---

## 🚀 Setup (5 steps)

### Step 1 — Install dependencies
```bash
npm install
```

### Step 2 — Create your .env file
```bash
cp .env.example .env
```

Open `.env` and paste your Neon DB connection string:
```
DATABASE_URL="postgresql://USER:PASSWORD@ep-xxxxx.us-east-2.aws.neon.tech/neondb?sslmode=require"
```

**Where to get it:**
1. Go to https://console.neon.tech
2. Open your project
3. Click **Connection Details**
4. Copy the connection string

### Step 3 — Push the schema to your Neon DB
```bash
npm run db:push
```
This creates all the tables in Neon. You only need to run this once (or again if you change schema.prisma).

### Step 4 — Generate the Prisma Client
```bash
npm run db:generate
```
This generates TypeScript types into `generated/prisma/`.

### Step 5 — Seed the default restaurants
```bash
npm run db:seed
```
This inserts the 12 restaurants from your original `data.ts` into the database.

### Start the dev server
```bash
npm run dev
```
Server runs at: **http://localhost:3001**

---

## 📡 Complete API Reference

### Health
```
GET /health
```

---

### 🍽️ Restaurants

```
GET    /api/restaurants          → all restaurants (default + custom)
GET    /api/restaurants/:id      → single restaurant
POST   /api/restaurants          → create custom restaurant
PUT    /api/restaurants/:id      → update custom restaurant
DELETE /api/restaurants/:id      → delete custom restaurant
```

**POST body example:**
```json
{
  "name": "Dhaniskal",
  "cuisine": "Indian"
}
```

---

### 📅 Date Assignments

```
GET    /api/assignments          → flat map { "2025-03-14": restaurant }
GET    /api/assignments/list     → array of full assignment objects
POST   /api/assignments          → assign (upsert) restaurant to date
POST   /api/assignments/bulk     → assign multiple at once
DELETE /api/assignments/:dateKey → remove one date's assignment
DELETE /api/assignments          → clear all assignments
```

**POST body example:**
```json
{
  "dateKey": "2025-03-14",
  "restaurantId": "r1"
}
```

**GET response:**
```json
{
  "success": true,
  "data": {
    "2025-03-14": { "id": "r1", "name": "Madouk", "cuisine": "Chinese and Thai", ... },
    "2025-03-16": { "id": "r3", "name": "Movie", "cuisine": "Entertainment", ... }
  },
  "count": 2
}
```

---

### 💝 App State

```
GET   /api/state     → { proposalAccepted: false }
PATCH /api/state     → update proposal accepted
```

**PATCH body:**
```json
{ "proposalAccepted": true }
```

---

## 🔌 Frontend Integration

### 1. Copy the API client into your Next.js project
```bash
cp lib/api.ts your-nextjs-project/lib/api.ts
```

### 2. Add env var to Next.js `.env.local`
```
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### 3. Update `drag-drop-planner.tsx`

```tsx
import { useEffect } from "react"
import { api } from "@/lib/api"

// ── Load all data on mount ──────────────────────────────────
useEffect(() => {
  async function load() {
    const [restaurants, assignments, state] = await Promise.all([
      api.restaurants.getAll(),
      api.assignments.getAll(),
      api.state.get(),
    ])
    setAllRestaurants(restaurants)  // replace static import
    setAssignments(assignments)     // restore saved plan
    if (state.proposalAccepted) setAccepted(true)
  }
  load()
}, [])

// ── Persist on drag end ─────────────────────────────────────
const handleDragEnd = useCallback(async (event: DragEndEvent) => {
  // ... existing logic to get dateKey and activeRestaurant ...
  setAssignments(prev => ({ ...prev, [dateKey]: activeRestaurant }))
  await api.assignments.assign(dateKey, activeRestaurant.id) // ← add this
}, [activeRestaurant])

// ── Persist on remove ───────────────────────────────────────
const handleRemove = useCallback(async (dateKey: string) => {
  setAssignments(prev => { const n = { ...prev }; delete n[dateKey]; return n })
  await api.assignments.remove(dateKey) // ← add this
}, [])

// ── Persist when she says yes ───────────────────────────────
const handleAccept = useCallback(async () => {
  await api.state.setProposalAccepted(true) // ← add this
  setAccepted(true)
}, [])
```

### 4. Update `restaurant-form-modal.tsx`

```tsx
import { api } from "@/lib/api"

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  const restaurant = await api.restaurants.create({ name }) // ← replace local object
  onSubmit(restaurant)
  onClose()
}
```

---

## 🛠️ All Scripts

| Command | What it does |
|---------|-------------|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Compile TypeScript |
| `npm run start` | Run compiled production build |
| `npm run db:push` | Push schema.prisma → Neon DB (no migration file) |
| `npm run db:migrate` | Create migration file + apply it |
| `npm run db:generate` | Regenerate Prisma Client types |
| `npm run db:seed` | Insert default restaurants into DB |
| `npm run db:studio` | Open Prisma Studio (visual DB browser) |

---

## 🌐 Deploying to Production

**Recommended: [Railway](https://railway.app) or [Render](https://render.com)**

1. Push this folder to its own GitHub repo
2. Connect to Railway/Render, create a new Web Service
3. Set environment variables:
   - `DATABASE_URL` = Neon connection string
   - `FRONTEND_URL` = your Vercel frontend URL (e.g. `https://your-app.vercel.app`)
   - `NODE_ENV` = `production`
   - `PORT` = `3001` (or whatever your host assigns)
4. Build command: `npm run build`
5. Start command: `npm run start`

Then update your Next.js Vercel deployment:
- Add env var: `NEXT_PUBLIC_API_URL=https://your-backend.railway.app/api`
