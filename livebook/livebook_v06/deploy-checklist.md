# Deploy Checklist — LiveBook v1 Prototype

## 1) Prereqs
- Node.js 20+, pnpm 9+ or npm 10+
- (Optional) Docker 24+
- A cloud Object Storage bucket (e.g., Yandex Object Storage / AWS S3) + CDN
- A domain/subdomain (optional but recommended)

## 2) Local Run (Backend)
```bash
cd backend
pnpm install
pnpm dev
# Server listens on http://localhost:8787
```
Health-check: `GET /health`

## 3) Local Run (SPA shells)
For each SPA:
```bash
cd spaas/<spa-name>
pnpm install
pnpm dev
# Visit the printed local URL (e.g., http://localhost:5173)
```
SPAs are static builds (`pnpm build`) → upload `/dist` contents to Object Storage.

## 4) Build/Upload SPAs to Object Storage
- Run `pnpm build` in each SPA folder → get `/dist/`
- In your cloud console/CLI, create buckets:
  - `livebook-user`, `livebook-editor`, `livebook-expert`, `livebook-author`
- Enable **static hosting** for each bucket
- Upload the `dist` files to each bucket root
- Set index document to `index.html` and error document to `index.html` (SPA routing)
- (Optional) Configure CDN in front of each bucket

## 5) Backend Deploy (Option A: VM/Container)
- Build: `pnpm build` (or `docker build -t livebook-api .` in `backend/`)
- Run behind reverse proxy (Nginx) with HTTPS
- Set env vars (see `.env.example`)

## 5) Backend Deploy (Option B: Serverless)
- Package the `backend` as a single function (Fastify can run in serverless adapters).
- Expose routes via API Gateway.
- Ensure cookie sessions and CORS allow your SPA origins.

## 6) Configure CORS & Cookies
- Allow Origins: the 4 SPA origins (user/editor/expert/author)
- Cookies: `Secure`, `HttpOnly`, `SameSite=Lax`
- CSRF: use `x-csrf-token` on state-changing requests

## 7) Smoke Tests
- `POST /ext/rc/import-json` with `sample/articles/tius.json`
- `GET /ext/rc/export-json?rc_id=...`
- `POST /ext/cross/grant`
- `POST /ext/cross/alignments`
- `POST /ext/cross/arbitrate`
- Open user SPA → list articles → open article

## 8) Observability
- Structured logs (JSON) to stdout
- Basic metrics: req/sec, latency, 4xx/5xx, token usage (future), ad impressions (future)

## 9) Security
- Rotate secrets regularly, restrict CORS
- Content Security Policy (CSP) for SPAs; allow only required ad/analytics domains
- Validate all JSON payloads against schemas
