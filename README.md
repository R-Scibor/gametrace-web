# GameTrace Web

Client-rendered React 19 + TypeScript SPA for GameTrace — the desktop analytics and library management companion to the mobile app.

See `docs/product-spec.md` for the product spec.

## Stack

React 19, TypeScript, Vite, React Router v7, TanStack Query, Zustand, axios, Recharts, CSS Modules.

## Routes

### Public

| Path | Purpose |
|------|---------|
| `/welcome` | Landing — what GameTrace is, onboarding, how to use |
| `/login` | Sign in with 6-digit link code from Discord `/login` (dev username fallback when `VITE_DEV_LOGIN_SECRET` is set) |
| `/auth/discord/callback` | Discord OAuth PKCE authentication callback |
| `/download` | Android APK download hub (+ install help; also `/download/`) |
| `/faq` | Interactive knowledge base & troubleshooting guide (categories, search, permalinks) |
| `/privacy` | Privacy policy (public; PL/EN full GDPR notice). Production: `https://gametrace.rscibor.dev/privacy` |
| `/delete-account` | Public self-service account deletion request |
| `/account/deletion-scheduled` | Confirmation screen after scheduling account deletion |
| `/account/pending-deletion` | Blocking intercept screen for accounts pending deletion (with cancel option) |

Unauthenticated users hitting any protected route are redirected to `/welcome`.

### Protected (requires auth)

| Path | Purpose |
|------|---------|
| `/` | Dashboard — active session, stat tiles, recent sessions |
| `/library` | Library grid with tabs, search, pagination |
| `/library/:gameId` | Game detail — stats, sessions, cover, merge, ignore |
| `/analytics` | Analytics panels (`?days=` window, default 7) |
| `/sessions/new` | Create session (voice prefill via query params) |
| `/sessions/:id/edit` | Edit / discard / delete session |
| `/voice` | Voice capture → transcribe → prefill new session |
| `/trash` | Trashed sessions — restore or hard-delete |
| `/settings` | Profile, timezone, notification toggles, logout |

### Admin (`is_admin` only)

Visible in the sidebar only when the logged-in user has `is_admin: true`. Non-admins hitting these URLs are redirected to `/`.

| Path | Purpose |
|------|---------|
| `/admin` | Przegląd: homelab overview tiles; attention counts link into filtered work surfaces |
| `/admin/reports` | Zgłoszenia: user report inbox, status filter, triage (mark triaged/closed) |
| `/admin/catalog` | Katalog: master-detail catalog review — filter/search/sort/paginate a list, inspect a selected game, enrich, IGDB link, aliases, merge (global search), global cover |

Admin API surface: `GET /api/v1/admin/stats/overview`, `GET/POST /api/v1/admin/games/*`
(list, enrich, match, igdb-link, aliases, merge, cover), `GET/PATCH /api/v1/admin/reports/*`
(list, triage). See backend `docs/api.md` § Admin.

## Development

```bash
npm install
npm run dev
```

The Vite dev server proxies `/api` and `/covers` to the backend. Override the target with:

```bash
VITE_BACKEND_ORIGIN=http://homelab:8010 npm run dev
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | Type-check + production build |
| `npm run preview` | Preview production build (no API proxy — see below) |
| `npm run test` | Vitest watch mode |
| `npm run test:run` | Vitest single run |
| `npm run test:coverage` | Vitest with coverage (70% line threshold) |
| `npm run lint` | ESLint |

### Preview warning

`npm run preview` serves the static build only. It does **not** proxy `/api` or `/covers` — authenticated pages will fail unless you run behind nginx or configure a reverse proxy yourself. Use `npm run dev` for local full-stack development.

## Testing

Tests use Vitest + React Testing Library + MSW (full `/api/v1` mock surface).

```bash
npm run test:run          # single run
npm run test:coverage     # with coverage report
```

Setup lives in `test/setup.ts` (global store reset), `test/handlers.ts` (MSW handlers), and `test/utils.tsx` (`renderPage`, `seedAuth`).

## Deployment

Deploy using Docker Compose with the prebuilt GHCR image:

```bash
docker compose pull && docker compose up -d
```

For local builds from source:

```bash
docker compose up -d --build
```

- **Image:** `ghcr.io/r-scibor/gametrace-web:${IMAGE_TAG:-latest}`
- **URL:** `http://localhost:8020` (host port `8020` mapped to internal unprivileged port `8080`)
- **API proxy:** `/api` and `/covers` → `gametrace_api:8010` (via `gametrace-backend_default` Docker network)
- **Homelab hostname:** `gametrace.home` (Nginx Proxy Manager → `:8020`)

The backend has no CORS middleware — all browser traffic must be same-origin through this nginx proxy.

### Runtime Configuration & Reloads

- **Environment variables (`VITE_DISCORD_*`):** Passed into the container at startup via Compose `environment:` and generated into `/env-config.js` by `/docker-entrypoint.d/40-env-config.sh`. Changing values in `.env` only requires recreating the container:
  ```bash
  docker compose up -d
  ```
  No image rebuild is necessary.
- **Proxy / DNS reloads:** `nginx.conf` resolves `gametrace_api` via Docker DNS on each request (avoids 502 after the API container is recreated without restarting web). If API calls still return **502** while `curl :8010/api/v1/health` is OK, reload web nginx without restarting the container:
  ```bash
  docker exec gametrace-web nginx -s reload
  ```

### Permissions & Static Downloads

The container runs as unprivileged Nginx (`nginxinc/nginx-unprivileged:alpine`, `UID 101`) listening on internal port `8080`.
Mounted volumes such as `./downloads` must have read and execute permissions for other users:
- `./downloads` directory: `0755` (`chmod o+rx ./downloads`)
- Files within (e.g., `gametrace.apk`): `0644` (`chmod o+r ./downloads/gametrace.apk`)

### Nginx Proxy Manager (homelab)

1. Add a **Proxy Host** for `gametrace.home`.
2. Forward to the host running Docker on port **8020** (scheme: `http`).
3. Enable **Websockets** if you add live features later; the current SPA does not require them.
4. Optional: attach an internal TLS certificate so browsers hit `https://gametrace.home`.

### Docker network

`docker-compose.yml` attaches `gametrace-web` to the external network `gametrace-backend_default`. That network is created by the backend stack — start the API (`gametrace_api`) before starting the web container, or Compose will fail to find the network.

### Health monitoring

- **SPA:** `GET http://localhost:8020/` should return the Vite-built `index.html`.
- **API (through proxy):** `GET http://localhost:8020/api/v1/health` should return JSON with `status`, `version`, and `bot.status`.
- Use the health endpoint for uptime checks; a `200` with `status: "ok"` means the proxy and API are reachable.