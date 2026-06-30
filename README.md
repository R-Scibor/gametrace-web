# GameTrace Web

Client-rendered React 19 + TypeScript SPA for GameTrace — the desktop analytics and library management companion to the mobile app.

See `docs/DESIGN.md` for the product spec.

## Stack

React 19, TypeScript, Vite, React Router v7, TanStack Query, Zustand, axios, Recharts, CSS Modules.

## Routes

| Path | Purpose |
|------|---------|
| `/login` | Sign in with Discord username (requires prior `/login` on the bot) |

Unauthenticated users are redirected to `/login`.

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
| `npm run preview` | Preview production build |
| `npm run test` | Vitest watch mode |
| `npm run test:run` | Vitest single run |
| `npm run lint` | ESLint |

## Deployment

Deploy using Docker Compose:

```bash
docker compose up -d --build
```

- **URL:** `http://localhost:8020`
- **API proxy:** `/api` and `/covers` → `gametrace_api:8010` (via `gametrace-backend_default` Docker network)
- **Homelab hostname:** `gametrace.home` (Nginx Proxy Manager → `:8020`)

The backend has no CORS middleware — all browser traffic must be same-origin through this nginx proxy.

### Nginx Proxy Manager (homelab)

1. Add a **Proxy Host** for `gametrace.home`.
2. Forward to the host running Docker on port **8020** (scheme: `http`).
3. Enable **Websockets** if you add live features later; the current SPA does not require them.
4. Optional: attach an internal TLS certificate so browsers hit `https://gametrace.home`.

### Docker network

`docker-compose.yml` attaches `gametrace-web` to the external network `gametrace-backend_default`. That network is created by the backend stack — start the API (`gametrace_api`) before building the web container, or Compose will fail to find the network.

### Health monitoring

- **SPA:** `GET http://localhost:8020/` should return the Vite-built `index.html`.
- **API (through proxy):** `GET http://localhost:8020/api/v1/health` should return JSON with `status`, `version`, and `bot.status`.
- Use the health endpoint for uptime checks; a `200` with `status: "ok"` means the proxy and API are reachable.