# GameTrace Web — Design Spec

> Status: Approved 2026-06-04. Companion document to `IMPLEMENTATION_PLAN.md`.

## 1. Concept & Positioning

GameTrace Web is the **desktop, "serious-view" companion** to the existing GameTrace mobile app
(React Native / Expo, in `../gametrace-mobile`). Both clients talk to the same backend
(`../gametrace-backend`, FastAPI at `http://homelab:8010`).

- **Mobile** = quick capture on the go (dashboard, add session, voice, light stats).
- **Web** = the **analytics powerhouse**: deep stats, full library management, and bulk
  housekeeping that a phone screen can't do justice. Computer-first layouts: persistent
  sidebar, multi-column dashboards, dense tables, real charts.

The web client achieves **full feature parity** with mobile **plus** every analytics and
management endpoint the backend already exposes but mobile never surfaced (heatmap, streak,
weekly trend, genres, themes, companies, release-years, trash/restore, game ignore/merge).

## 2. Goals & Non-Goals

**Goals**
- Surface 100% of the backend's read/write surface relevant to a single end user.
- Polished, distinctive desktop UI in the GameTrace visual language (dark industrial, orange).
- Deployable in the homelab the same way as `portfolio-site` / `lifeos` (Vite build → nginx in
  Docker → behind Nginx Proxy Manager at a `.home` hostname).
- Same-origin networking (nginx reverse-proxy) so the browser only talks to `gametrace.home`.

**Non-Goals (YAGNI)**
- No push notifications (FCM is mobile-only; the `/notifications/*` endpoints are out of scope).
- No multi-tenant operator console. A thin **homelab admin panel** exists for `is_admin` users (catalog review, merge, global covers); regular users see one library per session.
- No offline mode / PWA / service worker.
- No i18n framework. UI is **Polish only** (matching mobile).
- No SSR. Plain client-rendered SPA.

## 3. Users & Auth

- Primary auth: **6-digit link code** from the Discord `/login` slash command →
  `POST /api/v1/auth/link`. Dev fallback: username + `X-Dev-Login-Secret` when
  `VITE_DEV_LOGIN_SECRET` is set (`POST /api/v1/auth/login`, backend-gated).
- Bearer token; 30-day sliding-window expiry. `LoginResponse` and `/profile/me` include
  `is_admin` for gating admin routes and actions.
- Token + minimal user profile persist in `localStorage` (Zustand `persist`).
- A 401 from any call clears auth (and query cache). Unauthenticated access to protected routes redirects to `/welcome` (not `/login`); `/login` remains the explicit sign-in page.
- Login captures the browser timezone (`Intl.DateTimeFormat().resolvedOptions().timeZone`) and
  sends it so the backend's timezone-aware stats are correct.

## 4. Tech Stack

| Concern            | Choice                                  | Rationale |
|--------------------|------------------------------------------|-----------|
| Framework          | React 19 + TypeScript                   | Matches `portfolio-site`/`lifeos`. |
| Build tool         | Vite                                    | Homelab convention; fast HMR. |
| Routing            | React Router v7                         | Deep-linkable routes (`/analytics`, `/library/:id`). |
| Server state       | TanStack Query v5                       | Caching, polling (30s dashboard), invalidation. |
| Client state       | Zustand (+ `persist`)                   | Auth token + UI prefs only. Ported from mobile. |
| HTTP               | axios                                   | Single client w/ bearer + 401 interceptor (ported). |
| Charts             | Recharts                                | Bars/lines/areas. Heatmap = custom CSS grid. |
| Fonts              | `@fontsource/space-grotesk`, `@fontsource/dm-sans` | Same type pairing as mobile. |
| Styling            | CSS Modules + CSS custom properties     | Matches `portfolio-site`; tokens from mobile palette. |
| Testing            | Vitest + React Testing Library + MSW    | Unit/component/integration with a mocked backend. |
| Serving            | nginx (multi-stage Docker)              | Static SPA + reverse-proxy `/api` & `/covers`. |

## 5. Architecture

```
Browser ──(https://gametrace.home)──► Nginx Proxy Manager (SSL)
                                          │
                                          ▼
                         gametrace-web container (nginx :80, host :8020)
                          ├─ /                serve static SPA (try_files → index.html)
                          ├─ /api/v1/*  ─────► proxy_pass http://<backend>:8010
                          └─ /covers/*  ─────► proxy_pass http://<backend>:8010
```

- **Same-origin by design.** The SPA calls relative `/api/v1/...` and renders covers from
  relative `/covers/...`. nginx proxies both to the backend. The backend has **no CORS
  middleware** (verified), so this is the only clean option — never point the browser directly
  at `homelab:8010`.
- **Dev mode**: Vite dev server proxies `/api` and `/covers` to `http://homelab:8010`
  (configured in `vite.config.ts`), reproducing the same-origin shape locally.
- **Cover images**: server cover upload (`PUT /games/{id}/cover`) is not available to the
  web client (403). Custom covers are stored **locally** in `localCoversStore` (browser
  `localStorage`), matching the mobile pattern. Server `cover_image_url` is the fallback.

## 6. Navigation & Layout

Persistent **left sidebar** (collapses to icons under ~1100px):

```
◈ GAMETRACE
─────────────
▣ Pulpit         (Dashboard, /)
▤ Biblioteka     (Library, /library)
▦ Statystyki     (Analytics, /analytics)
＋ Dodaj sesję   (Add session, /sessions/new)
◉ Sesja głosowa  (Voice, /voice)
🗑 Kosz           (Trash, /trash)
⚙ Ustawienia     (Settings, /settings)
─────────────
◆ Administracja  (Admin hub, /admin — **admins only**)
```

Admin pages use a horizontal sub-nav: **Operacje** (`/admin`) · **Katalog** (`/admin/catalog`).

Top bar (sticky): page title on the left; on the right a **bot/health status pill**
and, whenever a session is `ONGOING`, a **pinned live timer** ("AKTYWNA SESJA · 01:23:45")
that links to the active game. Both pull from the dashboard poll / health query already in
cache.

## 7. Pages

| Route               | Page             | Contents |
|---------------------|------------------|----------|
| `/welcome`          | Landing          | Public onboarding — what GameTrace is, how to get started. |
| `/login`            | Auth             | Link-code form (default); optional dev username mode. Redirects to `/` when already authed. |
| `/`                 | Dashboard        | Active-session card (live timer, 30s poll) · today/7d/avg-session tiles · idle hero spotlight · pending-error banner · recent sessions (last 5, COMPLETED+ERROR). |
| `/library`          | Library          | Cover grid; tabs **Wszystkie / Do sprawdzenia / Inne**; server-side search; pagination; click → detail. |
| `/library/:gameId`  | Game detail      | Header (cover, name, enrichment status) · total time · paginated sessions · **local cover** (everyone) · **ignore toggle** · **merge + global cover** (admins only). |
| `/analytics`        | Analytics        | The powerhouse — see §8. |
| `/sessions/new`     | Add session      | Game search/resolve, start/end datetime, notes. **409 conflict** rendered inline with the conflicting session. Prefill via query params (from Voice). |
| `/sessions/:id/edit`| Edit session     | Edit `end_time` only (`PATCH`); **discard ERROR** → `DELETE` (soft-delete to trash). ONGOING is read-only. System notes displayed read-only when present. |
| `/voice`            | Voice            | Browser `MediaRecorder` capture → `POST /voice/transcribe` → resolve game → redirect to `/sessions/new` prefilled. |
| `/trash`            | Trash            | Trashed sessions, **`purges_at` countdown**, **restore** (re-validates conflict), **hard-delete**. |
| `/settings`         | Settings         | Profile · timezone · `weekly_report_enabled` + `push_enabled` toggles · bot/health/version · logout. |
| `/admin`            | Admin ops        | **Admin only.** Game search + ID lookup · merge · global cover upload. |
| `/admin/catalog`    | Catalog review   | **Admin only.** Global `NEEDS_REVIEW` table · re-queue enrich · IGDB link · add alias · merge/cover on selected row. |

## 8. Analytics Page (the differentiator)

A window selector (`?days=`, default 7; presets 7/30/90/365) drives a grid of independent
panels, each with its own query and its own loading / error / empty state so one failing panel
never blanks the page:

1. **Łącznie** — `total_seconds` for the window (big number).
2. **Ranking gier** — full `per_game` breakdown (sortable table + horizontal bars).
3. **Mapa aktywności** — `GET /stats/heatmap` 7×24 grid (custom CSS grid, orange intensity).
4. **Passa** — `GET /stats/streak` current + longest streak.
5. **Trend** — `GET /stats/trend?days=N` line/area chart (granularity adapts to window).
6. **Gatunki** — `GET /stats/genres` horizontal bars (note: tag exposure, can exceed total).
7. **Motywy** — `GET /stats/themes` horizontal bars (same caveat).
8. **Studia / Wydawcy** — `GET /stats/companies?role=developer|publisher` top-N, role toggle.
9. **Dekady premier** — `GET /stats/release-years` decade buckets bar chart.

Pending errors (from `/stats/summary`) surface a "napraw" link to the relevant edit page.

## 9. Data Layer

API modules mirror the backend, ported and extended from the mobile `app/api/*`:

- `auth` (link, login, logout), `profile` (me, settings), `sessions` (list, get, trash, create,
  patch `{ end_time? }`, delete, restore, hard-delete), `games` (list as `GameListResponse`,
  get by id, resolve, sessions, stats), `admin` (catalog list, enrich, IGDB match/link,
  aliases, merge, global cover), `stats` (summary, dashboard, heatmap, streak, trend,
  genres, themes, companies, release-years), `voice` (transcribe), `preferences` (upsert, delete), `health`.

One typed TanStack Query hook per concern. Query keys are structured for targeted
invalidation — e.g. creating/patching/deleting a session invalidates
`['dashboard']`, `['sessions']`, the affected `['game', id, 'sessions']`, and `['stats', ...]`.

Shared types live in `src/types/api.ts`, ported from mobile and extended with the
endpoint shapes mobile never used (heatmap cell, streak, trend bucket, genre/theme/company
entry, release-year bucket, trash row with `purges_at`, profile/settings).

## 10. Design System (evolved/refined)

Keep the spirit — dark industrial, orange `#ff7a1a`, sharp corners (2–4px radius), uppercase
letter-spaced labels, orange accent bars — but refine for desktop:

- Port the mobile palette (`theme/colors.ts`) verbatim into CSS custom properties.
- Type pairing: **Space Grotesk** (display/labels) + **DM Sans** (body), via `@fontsource`.
- Add a small **chart color ramp** derived from orange/warn for multi-series charts.
- Desktop affordances: hover/focus states, denser tables, skeleton loaders, a toast system.
- Reusable primitives: `Button`, `StatTile`, `SectionHeader`, `Cover`, `LiveTimer`,
  `ErrorBanner`, `Toast`, `Skeleton`, `Panel`.

## 11. Error Handling

- Global axios 401 interceptor → `teardownAuth()` (clear token + query cache). Route guard sends unauthenticated users to `/welcome`.
- Per-panel/query error UI (ported `ErrorBanner`), never a full-page blank for one failure.
- **409 conflict** on session create/restore: parse `ConflictResponse`
  (`detail.detail` + `detail.conflicting_session`) and render the conflicting session inline.
- Mutation feedback via toasts (success/failure).
- Voice flow explicit state machine: `idle → recording → processing → (prefill | error)`,
  including a `PERMISSION_DENIED` path when the mic is blocked.

## 12. Time & Timezone

- All timestamps are rendered in the **user's timezone** (from `/profile/me`), using
  `Intl.DateTimeFormat` / `toLocaleString('pl', { timeZone })`.
- Durations formatted as `Xh Ym` (or `Ym`); helper shared across pages.
- Live timer ticks client-side every second from `start_time` (ported `LiveTimer`).

## 13. Testing Strategy

- **Vitest + React Testing Library + MSW** (mock the whole `/api/v1` surface with fixtures).
- Priority coverage: api client (bearer + 401), auth/link flow, session create incl. 409
  conflict, dashboard polling + live timer, each analytics panel renders from a fixture,
  voice state machine (mocked `MediaRecorder`), trash restore/hard-delete, admin catalog
  ops (MSW handlers for `/admin/games/*`).
- Formatting/util helpers get plain unit tests.

## 14. Deployment

- **Multi-stage Dockerfile**: `node:22-alpine` build (`npm ci && npm run build`) →
  `nginx:alpine` serving `/dist` with SPA fallback + the `/api` & `/covers` proxy.
- **`docker-compose.yml`**: `gametrace-web` service, `8020:80`, `restart: unless-stopped`,
  `label app=gametrace-web`. Reaches the backend via the `gametrace-backend_default` Docker
  network (`gametrace_api:8010`).
- **NPM**: proxy host `gametrace.home → host :8020` with SSL. `.home` resolves via Pi-hole.
- Port **8020** (3050 = portfolio-site, 3060 unused).
- **CI**: GitHub Actions runs lint, test, build, and a Docker build smoke step.

## 15. Repo Structure

```
gametrace-web/
├── docs/
│   ├── DESIGN.md                  ← this file
│   └── IMPLEMENTATION_PLAN.md
├── public/
├── src/
│   ├── api/          # axios client + one module per endpoint group
│   ├── hooks/        # TanStack Query hooks (queries + mutations)
│   ├── components/   # reusable primitives + layout (Sidebar, TopBar, charts)
│   ├── pages/        # one folder/file per route
│   ├── store/        # Zustand: authStore, settingsStore
│   ├── theme/        # colors/tokens (.ts + CSS vars), global.css
│   ├── lib/          # formatters, timezone, query client, constants
│   └── types/        # api.ts
├── test/             # setup, MSW handlers, fixtures
├── Dockerfile
├── nginx.conf
├── docker-compose.yml
├── vite.config.ts
├── tsconfig*.json
├── package.json
└── README.md
```
