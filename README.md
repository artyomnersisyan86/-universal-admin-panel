# Universal Admin Panel

Fullstack admin panel builder: React + Vite frontend, NestJS + PostgreSQL backend, Docker for dev & prod.

## Features

- **Drag & Drop Form Builder** — palette of inputs (text, select, TinyMCE rich-text, image, file, button), drop onto canvas, configure per-field properties.
- **Multilingual content fields** — any field can be marked multilingual (hy / ru / en tabs). Required + multilingual = all three languages mandatory.
- **Dynamic Table Builder** — `@tanstack/react-table` + `dnd-kit`: drag rows, drag columns, sort, per-column search, column visibility, server-side pagination, Copy JSON.
- **Statistics Dashboard** — drag-and-drop widgets, Recharts line/bar charts, data from any endpoint.
- **Backend API Builder** (superadmin only) — UI to create REST endpoints (GET/POST/PATCH/DELETE) backed by either a static JSON template or a safe DB query. Routes are registered at runtime.
- **Multilingual UI** — `react-i18next`, namespaces `common` / `admin` / `errors`, languages `hy` (default) / `ru` / `en`.
- **Reusable shared/ui** — `Typography` (fluid `clamp()`), `Button` (primary | outlined | text × small | medium | large), `FormGroup` (schema-driven RHF + Zod). All components copy-portable to other projects.
- **Theming** — dark/light toggle on `<body data-theme="…">`. Brand color `#2610cc`, ≤6 colors total (palette includes a harmonious green).
- **Production-ready** — multi-stage Dockerfiles for client and server, `docker-compose.yml` (dev) and `docker-compose.prod.yml` (prod), Nginx reverse proxy, health checks.

## Tech stack

| Layer        | Tech                                                                          |
|--------------|-------------------------------------------------------------------------------|
| Frontend     | React 18, TypeScript, Vite, dnd-kit, RHF + Zod, Recharts, `@tanstack/react-table`, `i18next`, TinyMCE |
| Backend      | NestJS, TypeORM, PostgreSQL 16, `class-validator`, JWT auth                   |
| Styling      | Pure CSS + CSS custom properties (no UI framework)                            |
| Infra        | Docker, docker-compose, Nginx                                                 |

## Repository layout

```
.
├── client/        # React/Vite SPA
├── server/        # NestJS API
├── docker/        # nginx & postgres init
├── docs/          # architecture, components, api docs
├── docker-compose.yml         # dev
├── docker-compose.prod.yml    # prod
└── .env.example
```

See [`docs/architecture.md`](./docs/architecture.md) for the full design.

## Quick start — local dev (no Docker, no external DB)

The server defaults to **SQLite** (file-based, zero install). Only Node 20+ is required.

```powershell
# 1. Install dependencies
cd server
npm install
cd ..\client
npm install
cd ..

# 2. (Optional) create .env — defaults already work
copy .env.example .env

# 3. Run server (terminal 1)  →  http://localhost:3000
cd server
npm run start:dev

# 4. Run client (terminal 2) — Vite proxies /api → :3000
cd client
npm run dev                                  # opens http://localhost:5173
```

Open **http://localhost:5173**. A superadmin is seeded from `SEED_SUPERADMIN_EMAIL` / `SEED_SUPERADMIN_PASSWORD` (defaults: `admin@example.com` / `admin`). The SQLite DB lives at `server/data/app.sqlite` — delete the file to reset.

### Quick start — with Docker (alternative)

If you install Docker later and want the full Postgres + Nginx stack:

```bash
cp .env.example .env
# Uncomment DATABASE_URL=postgres://… in .env to switch to Postgres
docker compose up --build
```

Visit **http://localhost** (Nginx fronts both client `/` and API `/api`).

## Production deployment

```bash
cp .env.example .env
# Set strong JWT_SECRET, POSTGRES_PASSWORD, SEED_SUPERADMIN_PASSWORD

docker compose -f docker-compose.prod.yml up -d --build
```

Migrations:
```bash
docker compose -f docker-compose.prod.yml exec server npm run migration:run
```

## Environment variables

| Key                          | Default                              | Description                            |
|------------------------------|--------------------------------------|----------------------------------------|
| `POSTGRES_USER`              | admin                                | Postgres user                          |
| `POSTGRES_PASSWORD`          | admin                                | Postgres password                      |
| `POSTGRES_DB`                | admin_panel                          | DB name                                |
| `DATABASE_URL`               | postgres://admin:admin@postgres:5432/admin_panel | Used by server (overridden by compose) |
| `JWT_SECRET`                 | dev-secret-change-me                 | **Set to a long random string in prod** |
| `JWT_EXPIRES_IN`             | 7d                                   | JWT lifetime                           |
| `SEED_SUPERADMIN_EMAIL`      | admin@example.com                    | First superadmin                       |
| `SEED_SUPERADMIN_PASSWORD`   | admin                                | First superadmin password              |
| `UPLOAD_DIR`                 | /app/uploads                         | Server-side upload directory           |
| `MAX_UPLOAD_MB`              | 5                                    | Max upload size                        |
| `VITE_API_URL`               | /api                                 | Client → API base URL                  |
| `VITE_DEFAULT_LANG`          | hy                                   | Default UI language                    |
| `NGINX_HTTP_PORT`            | 80                                   | Exposed HTTP port                      |

## Docs

- [`docs/architecture.md`](./docs/architecture.md) — system overview and decisions
- [`docs/components.md`](./docs/components.md) — shared/ui usage guide
- [`docs/api.md`](./docs/api.md) — REST contract + dynamic endpoint engine

## Scripts

Root:
```bash
npm run dev         # docker compose up
npm run build       # build client + server
npm run lint        # lint both workspaces
npm run format      # prettier
```

Client (`cd client`):
```bash
npm run dev
npm run build
npm run typecheck
```

Server (`cd server`):
```bash
npm run start:dev
npm run build
npm run migration:generate -- src/migrations/NAME
npm run migration:run
```

## License

MIT
