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

## New (v0.3) — Auth, Roles, Moderation, Export, Translations
- **Auth**: POST /api/auth/login { email, name? } → returns JWT. Configure `JWT_SECRET` and optionally `ADMIN_EMAILS="you@example.com"` in `.env` to auto-admin.
- **Role-guarded Editor API** under `/api/editor/*` (requires Bearer token).
- **Moderation queue** UI in frontend sidebar (visible to EDITOR/ADMIN).
- **Export** endpoint: `/api/editor/export` (fmt: pdf|epub|html) — uses Puppeteer (PDF) and epub-gen-memory (EPUB).
- **Translations init**: place thesis UUIDs into `backend/prisma/translations_seed.json` and call button in EditorPanel.

### Env additions
```bash
# in backend .env
JWT_SECRET=dev-secret-change-me
ADMIN_EMAILS=your.email@example.com
```

### First admin
- Start backend, frontend.
- In UI, log in with the email listed in `ADMIN_EMAILS` — role will auto-elevate to ADMIN.

### Export requirements
- Puppeteer downloads Chromium on install. If your environment blocks it, set `PUPPETEER_SKIP_DOWNLOAD=1` and install system Chrome, then set `PUPPETEER_EXECUTABLE_PATH`.

### Translations seed
- After seeding DB, fetch the UUID for `ths-2025-001` and put it into `backend/prisma/translations_seed.json` (`REPLACE_WITH_THESIS_UUID`). Then press the "Загрузить базовые переводы" button in EditorPanel.
