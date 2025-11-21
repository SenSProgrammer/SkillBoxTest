# LiveBook — MVP (clean code)

Monorepo: backend (Fastify + Prisma), frontend (React + Vite), chrome-extension (MV3), infra (Docker for Postgres + Redis).

## Requirements
- Node.js 18+ (or 20+)
- pnpm (recommended) or npm/yarn
- Docker + Docker Compose

## Quick start (local dev with Docker)
```bash
# 1) Clone and enter
# git clone <your-repo> livebook && cd livebook

# 2) Start DBs
pnpm i
pnpm db:up

# 3) Backend: migrate & seed & run
cd backend
cp ../.env.example .env
pnpm prisma:generate
pnpm prisma:migrate
pnpm prisma:seed
pnpm dev    # runs on http://localhost:8080 (Swagger /docs)

# 4) Frontend
cd ../frontend
echo VITE_API_BASE=http://localhost:8080 > .env.local
pnpm dev    # runs on http://localhost:5173

# 5) Open the UI and test
# - Tree appears with demo thesis
# - Open Swagger at http://localhost:8080/docs
```

## Install modules (if you prefer npm)
Replace `pnpm` with `npm`:
```bash
npm install
npm run db:up
cd backend && npx prisma generate && npx prisma migrate dev --name init && npm run dev
cd ../frontend && npm run dev
```

## Workspaces scripts (from repo root)
```bash
pnpm dev         # run backend + frontend (needs concurrently installed in root)
pnpm build       # build all
pnpm start       # start backend only
pnpm db:up       # start Postgres + Redis via Docker Compose
pnpm db:down     # stop and remove volumes
```

## Chrome extension (manual load during MVP)
- Open `chrome://extensions`
- Enable **Developer mode**
- "Load unpacked" → select `chrome-extension/`
- Popup allows sending text to `/api/comments/ingest`

## Notes
- This is a **clean code** package (no node_modules included).
- Environment variables are in `.env.example` (copy to backend `.env` when needed).
- DB: Postgres 15 on `localhost:5432` / Redis 7 on `6379` via Docker.
