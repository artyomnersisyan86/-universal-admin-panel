# Universal Admin Panel — Architecture

> Architect Agent output. Review and approve before implementation begins.

## 1. High-level

A monorepo containing a React/Vite client and a NestJS server, talking over REST through an Nginx reverse proxy. Postgres for persistence. The whole stack is orchestrated via `docker-compose` for dev and production.

```
┌────────┐   80/443    ┌─────────┐   /         ┌──────────┐
│ Browser│ ──────────► │  Nginx  │ ──────────► │  client  │  (static, Nginx)
└────────┘             │ (proxy) │   /api      │ (Vite SPA)│
                       │         │ ──────────► ┌──────────┐
                       └─────────┘             │  server  │  (NestJS)
                                               └────┬─────┘
                                                    │  TCP 5432
                                                    ▼
                                              ┌──────────┐
                                              │ postgres │
                                              └──────────┘
```

## 2. Repository layout

```
universal-admin-panel/
├── client/                          # React + Vite + TS
│   ├── src/
│   │   ├── app/                     # App shell, providers, router
│   │   ├── shared/
│   │   │   ├── ui/                  # COPY-PORTABLE components
│   │   │   │   ├── Typography/      # h1..h6, body, caption (clamp)
│   │   │   │   ├── Button/          # primary | outlined | text × s/m/l
│   │   │   │   ├── FormGroup/       # schema-driven RHF+Zod
│   │   │   │   ├── LanguageTabs/    # hy | ru | en wrapper
│   │   │   │   ├── TextInput/
│   │   │   │   ├── Select/
│   │   │   │   ├── RichTextEditor/  # @tiptap/react + @tiptap/starter-kit
│   │   │   │   ├── ImageUpload/
│   │   │   │   ├── FileUpload/
│   │   │   │   └── index.ts
│   │   │   ├── lib/                 # apiClient, hooks, utils
│   │   │   └── i18n/                # i18next setup + translations
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   ├── form-builder/        # Palette + Canvas + PropertyPanel
│   │   │   ├── table-builder/       # tanstack-table + dnd-kit
│   │   │   ├── dashboard/           # Recharts widgets
│   │   │   └── api-builder/         # superadmin dynamic endpoints
│   │   ├── pages/                   # route components
│   │   ├── styles/                  # global CSS
│   │   │   ├── tokens.css           # CSS custom properties
│   │   │   ├── themes.css           # [data-theme="dark"] overrides
│   │   │   ├── reset.css
│   │   │   └── typography.css
│   │   ├── types/
│   │   └── main.tsx
│   ├── public/
│   ├── Dockerfile
│   ├── nginx.conf                   # SPA fallback
│   ├── vite.config.ts
│   └── package.json
│
├── server/                          # NestJS
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/                # JWT + role guard
│   │   │   ├── users/
│   │   │   ├── form-schemas/        # saved form-builder schemas
│   │   │   ├── tables/              # table defs + rows + ordering
│   │   │   ├── dashboard/           # widgets
│   │   │   ├── dynamic-endpoints/   # runtime route engine
│   │   │   └── uploads/             # files & images
│   │   ├── common/                  # decorators, filters, pipes
│   │   ├── config/                  # env, db, jwt
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── Dockerfile
│   └── package.json
│
├── docker/
│   ├── nginx/default.conf           # reverse proxy
│   └── postgres/init.sql
├── docs/
│   ├── architecture.md              # this file
│   ├── components.md
│   └── api.md
├── docker-compose.yml               # dev
├── docker-compose.prod.yml          # prod
├── .env.example
├── .gitignore
├── .claudeignore
├── README.md
└── package.json                     # npm workspaces: client, server
```

## 3. Frontend component tree

```
<App>
  <ThemeProvider>           data-theme on <body>, persisted in localStorage
    <I18nProvider>          i18next; lang persisted, default hy
      <QueryClientProvider> @tanstack/react-query
        <AuthProvider>
          <Router>
            /login        → <LoginPage>
            /             → <AdminLayout>
                              <TopBar/>     theme toggle, lang switch, user
                              <Sidebar/>    nav
                              <main>
                                /dashboard      <DashboardPage>      (DnD widgets)
                                /form-builder   <FormBuilderPage>    Palette+Canvas+Props
                                /forms/:id      <FormViewPage>       <FormGroup>
                                /tables         <TableListPage>
                                /tables/:id     <TableEditPage>      <DataTable>
                                /api-builder    <ApiBuilderPage>     superadmin only
                                /settings       <SettingsPage>
```

### Shared UI contract (copy-portable to other projects)

Each `shared/ui/<Component>/` folder is self-contained:
```
Button/
├── Button.tsx
├── Button.css          # only this component's styles
└── index.ts
```
No external state, no API imports — only React + i18next (optional) + theme CSS variables.

## 4. Data flow

- **Server state**: `@tanstack/react-query` (mutations + cache invalidation).
- **Forms**: `react-hook-form` + `@hookform/resolvers/zod`. Each multilingual field shape:
  `{ hy: string, ru: string, en: string }`. Validation: Zod schema generated from form-builder definition.
- **Auth**: JWT, stored in `localStorage` (`access_token`). Axios interceptor attaches `Authorization: Bearer`. 401 → redirect to `/login`.
- **Server errors → field errors**: Backend returns `400 { errors: { fieldName: 'msg' } }` or for multilingual `{ errors: { fieldName: { hy: 'msg' } } }`. A helper `applyServerErrors(form, errors)` calls `setError` on RHF.
- **Theme**: `data-theme="dark"` on `<body>`. CSS variables flip; components reference only `var(--token)`.
- **i18n**: namespaces `common`, `admin`, `errors`. JSON files in `client/src/shared/i18n/locales/{hy,ru,en}/{namespace}.json`.

## 5. Backend modules

| Module               | Responsibility                                                       |
|----------------------|----------------------------------------------------------------------|
| `auth`               | `/auth/login`, `/auth/me`, JWT strategy, `@Roles()` decorator + guard|
| `users`              | CRUD users; only `superadmin` can change roles                       |
| `form-schemas`       | Persist form-builder output as `jsonb`                               |
| `tables`             | Table definitions (columns config) + paginated rows + reorder        |
| `dashboard`          | Widget configs (type, data endpoint, layout order)                   |
| `dynamic-endpoints`  | CRUD endpoint definitions + **runtime dispatcher**                   |
| `uploads`            | Multipart upload, stores in volume, returns URL                      |

### Dynamic endpoint engine

NestJS does not allow adding decorator-based controllers at runtime, so we use a **catch-all dispatcher**:

```ts
@Controller('api')
export class DynamicDispatcherController {
  constructor(private readonly registry: DynamicEndpointsService) {}

  @All('*')
  async handle(@Req() req, @Res() res) {
    const def = await this.registry.match(req.method, req.path);
    if (!def) return res.status(404).json({ error: 'Not found' });
    if (def.mode === 'static') return res.json(def.responseTemplate);
    if (def.mode === 'db')     return res.json(await this.registry.runQuery(def.dbQueryConfig));
  }
}
```

- Registered AFTER all static controllers so they take precedence.
- Definitions cached in memory; cache busted on CRUD via internal event.
- `db` mode uses a whitelisted, parameterized query builder — never raw user SQL.

## 6. Database schema (PostgreSQL)

```sql
users (
  id uuid pk default gen_random_uuid(),
  email text unique not null,
  password_hash text not null,
  role text not null check (role in ('superadmin','admin','user')),
  created_at, updated_at
)

form_schemas (
  id uuid pk,
  name text not null,
  schema jsonb not null,          -- array of FieldDef
  created_by uuid references users,
  created_at, updated_at
)

table_definitions (
  id uuid pk,
  name text not null,
  columns jsonb not null,         -- [{ key, label, type, multilingual, order, hidden, searchable }]
  created_at, updated_at
)

table_rows (
  id uuid pk,
  table_id uuid references table_definitions on delete cascade,
  data jsonb not null,
  "order" int not null default 0,
  created_at, updated_at
)
create index on table_rows (table_id, "order");

dynamic_endpoints (
  id uuid pk,
  method text not null,           -- GET|POST|PATCH|DELETE
  path text not null,             -- e.g. /api/custom-users
  mode text not null,             -- static | db
  response_template jsonb,
  db_query_config jsonb,
  enabled boolean default true,
  created_by uuid references users,
  created_at, updated_at,
  unique (method, path)
)

dashboard_widgets (
  id uuid pk,
  type text not null,             -- line | bar
  title text not null,
  data_endpoint text not null,
  config jsonb,
  "order" int default 0
)

uploads (
  id uuid pk,
  filename text,
  mime_type text,
  size int,
  url text,
  created_at
)
```

## 7. REST API surface

| Method | Path                                           | Auth        |
|--------|------------------------------------------------|-------------|
| POST   | `/api/auth/login`                              | public      |
| GET    | `/api/auth/me`                                 | any         |
| GET    | `/api/users` `?page=&limit=`                   | admin+      |
| POST   | `/api/users`                                   | admin+      |
| PATCH  | `/api/users/:id`                               | admin+      |
| DELETE | `/api/users/:id`                               | superadmin  |
| GET    | `/api/form-schemas`                            | admin+      |
| POST   | `/api/form-schemas`                            | admin+      |
| GET    | `/api/form-schemas/:id`                        | admin+      |
| PATCH  | `/api/form-schemas/:id`                        | admin+      |
| DELETE | `/api/form-schemas/:id`                        | admin+      |
| GET    | `/api/tables`                                  | admin+      |
| GET    | `/api/tables/:id/rows?page=&limit=&sort=&q=`   | admin+      |
| POST   | `/api/tables/:id/rows`                         | admin+      |
| PATCH  | `/api/tables/:id/rows/reorder`                 | admin+      |
| PATCH  | `/api/tables/:id/columns`                      | admin+      |
| PATCH  | `/api/tables/:id/rows/:rowId`                  | admin+      |
| DELETE | `/api/tables/:id/rows/:rowId`                  | admin+      |
| GET    | `/api/dashboard/widgets`                       | admin+      |
| POST   | `/api/dashboard/widgets`                       | admin+      |
| GET    | `/api/dynamic-endpoints`                       | superadmin  |
| POST   | `/api/dynamic-endpoints`                       | superadmin  |
| PATCH  | `/api/dynamic-endpoints/:id`                   | superadmin  |
| DELETE | `/api/dynamic-endpoints/:id`                   | superadmin  |
| POST   | `/api/uploads`                                 | admin+      |
| ALL    | `/api/*` (dispatcher)                          | per-endpoint|

All non-public routes require `Authorization: Bearer <jwt>`.
Roles enforced via `@Roles('superadmin')` + `RolesGuard`.

Error contract (HTTP 400):
```json
{
  "errors": {
    "fieldName": "message",
    "multilingualField": { "hy": "required" }
  }
}
```

## 8. Docker architecture

### Services (`docker-compose.yml`)

| Service   | Image / build              | Ports     | Purpose                                |
|-----------|----------------------------|-----------|----------------------------------------|
| postgres  | `postgres:16-alpine`       | (internal)| Database, volume `pg_data`             |
| server    | build `./server`           | (internal)| NestJS                                 |
| client    | build `./client`           | (internal)| Nginx serving static build             |
| nginx     | `nginx:alpine` + conf      | 80, 443   | Reverse proxy `/api` → server, `/` → client |

Volumes: `pg_data`, `uploads_data` (mounted into server).
Healthchecks on each service.
Two compose files: dev (mounts source, hot reload) vs prod (built images, no source mount).

## 9. Theming — CSS custom properties

`client/src/styles/tokens.css`:
```css
:root {
  --color-primary: #2610cc;
  --color-secondary: #3a1de0;
  --color-success: #2e7d32;
  --color-warning: #ed6c02;
  --color-error:   #d32f2f;
  --color-neutral: #9e9e9e;

  --bg:        #ffffff;
  --bg-elev:   #f7f7fa;
  --fg:        #111119;
  --fg-muted:  #5a5a6a;
  --border:    #e3e3eb;

  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;

  --space-1: 4px;  --space-2: 8px;  --space-3: 12px;
  --space-4: 16px; --space-5: 24px; --space-6: 32px;
}

[data-theme="dark"] {
  --bg:       #0e0e14;
  --bg-elev:  #16161f;
  --fg:       #f0f0f5;
  --fg-muted: #a0a0b0;
  --border:   #2a2a3a;
}
```

Typography uses `clamp()`:
```css
.t-h1 { font-size: clamp(1.75rem, 1.2rem + 2vw, 2.75rem); }
.t-h2 { font-size: clamp(1.5rem, 1.1rem + 1.5vw, 2.25rem); }
/* ... */
```

## 10. Build & deploy summary

- **Local dev**: `docker compose up` — Postgres + server (watch) + client (Vite dev). Visit `http://localhost`.
- **Production**: `docker compose -f docker-compose.prod.yml up -d --build` — Nginx fronts pre-built static client + server.
- **Migrations**: TypeORM `synchronize: false` in prod; migrations under `server/src/migrations/`. CLI: `npm run migration:run` inside the server container.
- **Seed**: One-time script creates a superadmin from env `SEED_SUPERADMIN_EMAIL` / `SEED_SUPERADMIN_PASSWORD`.

## 11. Open decisions (please confirm)

1. **ORM choice** — spec says "TypeORM (or Prisma)". I propose **TypeORM** for tighter NestJS integration. OK?
2. **Server state lib** — I propose `@tanstack/react-query`. Spec doesn't mention it. OK?
3. **Auth storage** — JWT in `localStorage` vs `httpOnly` cookie. I propose `localStorage` for simplicity (Bearer token); cookie route is safer against XSS. Which?
4. **Rich text editor** — uses **TipTap** (`@tiptap/react` + `@tiptap/starter-kit`). Headless, MIT-licensed, no API key required. Replaced the original TinyMCE plan during Stage 2.
5. **Monorepo tool** — npm workspaces (simplest) vs Turborepo/pnpm. I propose **npm workspaces**. OK?
6. **Rename `․claude/`** → `.claude/` (current folder uses U+2024, not real dot — breaks Claude Code tooling). OK to rename?

---

**Status:** awaiting approval before scaffolding begins.
