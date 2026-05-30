# REST API

Base URL: `/api` (Nginx routes it to the NestJS server).
All non-public endpoints require `Authorization: Bearer <jwt>`.

> 📮 A ready-to-import Postman collection + environment live in [`docs/postman/`](postman/). See [postman.md](postman.md) for the import/run flow. CORS is enabled globally (`NestFactory.create(AppModule, { cors: true })`), so the API is reachable from any origin during development.

## Error contract

HTTP `400` (validation) and `409`/`404` semantic errors return:

```json
{
  "errors": {
    "fieldName": "messageKey",
    "multilingualField": { "hy": "required" }
  }
}
```

The client uses `applyServerErrors()` to map these into RHF field errors (multilingual errors appear under the appropriate language tab).

`401` returns `{ "message": "Unauthorized" }`; the client interceptor clears the token and redirects to `/login`.

---

## Auth

### `POST /api/auth/login`

Public.

```jsonc
// request
{ "email": "admin@example.com", "password": "admin" }

// response 200
{
  "token": "eyJhbGciOi…",
  "user": { "id": "...", "email": "...", "role": "superadmin", "createdAt": "…", "updatedAt": "…" }
}
```

### `GET /api/auth/me`

Returns the authenticated user.

---

## Users (admin+)

| Method | Path                | Body                                       |
|--------|---------------------|--------------------------------------------|
| GET    | `/api/users`        | `?page=1&limit=25`                         |
| POST   | `/api/users`        | `{ email, password, role? }`               |
| PATCH  | `/api/users/:id`    | `{ email?, password?, role? }`             |
| DELETE | `/api/users/:id`    | **superadmin only**                        |

---

## Sections (the headline feature)

A **section** is a content type (`news`, `products`, …). It owns a slug, a multilingual name, an `isPublic` flag, and a single `layout` (the block tree the page-builder edits). Creating a section makes it appear in the sidebar and exposes it through the universal entry dispatcher below.

| Method | Path                | Min role     | Body / notes                                            |
|--------|---------------------|--------------|---------------------------------------------------------|
| GET    | `/api/sections`     | `admin`      | List all sections                                       |
| GET    | `/api/sections/:id` | `admin`      | One section                                             |
| POST   | `/api/sections`     | `superadmin` | `{ slug, name, layout, isPublic?, icon?, displayOrder? }` |
| PATCH  | `/api/sections/:id` | `superadmin` | Partial; change layout here                             |
| DELETE | `/api/sections/:id` | `superadmin` | `204`; **cascades** to all entries in the section       |

- `slug` must match `^[a-z][a-z0-9-]*$` and is checked against a reserved list (`auth`, `users`, `sections`, `entries`, `uploads`, …). A reserved slug returns `409 { "errors": { "slug": "reserved" } }`.
- `name` is multilingual: `{ "hy": "...", "ru": "...", "en": "..." }`.
- `layout` is opaque `jsonb` — the block tree produced by the section-builder.
- **Layout migrations** are additive (spec decision A): editing a section's layout never touches existing entry `data`. Removed fields are soft-hidden, not deleted.

---

## Entries — universal dispatcher

Every section is served at `/api/:sectionSlug`. This controller is registered **after** all static `/api/*` controllers but **before** the dynamic-endpoint catch-all, so it never shadows `/api/auth`, `/api/sections`, etc.

| Method | Path                          | Auth                                  | Returns                                  |
|--------|-------------------------------|---------------------------------------|------------------------------------------|
| GET    | `/api/:slug`                  | public if `isPublic`, else JWT        | List of entries                          |
| GET    | `/api/:slug/:id`              | public if `isPublic`, else JWT        | One entry                                |
| POST   | `/api/:slug`                  | JWT + `admin`                         | Created entry (`status: draft`)          |
| PATCH  | `/api/:slug/:id`              | JWT + `admin`                         | Updated entry                            |
| POST   | `/api/:slug/:id/publish`      | JWT + `admin`                         | Entry with `status: published`           |
| DELETE | `/api/:slug/:id`              | JWT + `admin`                         | `204`                                    |

**Drafts & visibility** (spec decision B):

- New entries start as `draft`. Anonymous GET returns **only published** entries.
- An admin (JWT) sees both; filter with `?status=draft` or `?status=published`.
- `POST /api/:slug/:id/publish` (or `PATCH … { "status": "published" }`) stamps `publishedAt` and exposes the entry publicly.

**Locale collapsing** (spec decision 4): add `?lang=hy|ru|en` to any GET to flatten every multilingual field to that single locale. Without it the full `{ hy, ru, en }` object is returned. An unknown code → `400 { "errors": { "lang": "invalidLocale" } }`.

`POST` / `PATCH` body: `{ "data": { ... }, "status"?: "draft" | "published" }`. `data` is free-form `jsonb` keyed by the section's field keys; multilingual fields are nested `{ hy, ru, en }` objects.

Serialized entry shape:

```jsonc
{
  "id": "uuid",
  "sectionId": "uuid",
  "sectionSlug": "news",
  "status": "published",
  "data": { /* field values, or collapsed locale when ?lang= */ },
  "publishedAt": "2026-05-30T…Z" /* or null */,
  "createdAt": "…",
  "updatedAt": "…"
}
```

Edge cases: unknown slug → `404`; non-UUID `:id` → `400`; private section without JWT → `401`; private section with a non-admin token → `403`.

### `GET /api/entries` (admin+)

Cross-section list of every entry (used by the admin tables view), independent of the per-slug dispatcher.

---

## Layout templates (superadmin)

Reusable layout snapshots so a new section can start from an existing structure (spec decision D).

| Method | Path                                  | Body                                  |
|--------|---------------------------------------|---------------------------------------|
| GET    | `/api/layout-templates`               | List                                  |
| GET    | `/api/layout-templates/:id`           | One                                   |
| POST   | `/api/layout-templates`               | `{ name, description?, layout }`      |
| POST   | `/api/layout-templates/from-section`  | `{ sectionId, name, description? }` — snapshots that section's current layout |
| PATCH  | `/api/layout-templates/:id`           | Partial                               |
| DELETE | `/api/layout-templates/:id`           | `204`                                 |

---

## Form schemas (admin+)

> Legacy builder utility — now lives under **Settings**. Superseded by Sections for content modelling.

Stored builder output (a list of `FieldDef`).

```http
GET    /api/form-schemas
GET    /api/form-schemas/:id
POST   /api/form-schemas    { "name": "...", "schema": [ ...FieldDef ] }
PATCH  /api/form-schemas/:id
DELETE /api/form-schemas/:id
```

A `FieldDef`:
```ts
{
  id: string;
  type: 'text' | 'select' | 'richtext' | 'image' | 'file' | 'button';
  name: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  multilingual?: boolean;
  options?: { value: string; label: string }[];
  validation?: { minLength?: number; maxLength?: number; pattern?: string };
}
```

---

## Tables (admin+)

```http
GET    /api/tables
POST   /api/tables                       { "name": "...", "columns": [...] }
PATCH  /api/tables/:id
DELETE /api/tables/:id

GET    /api/tables/:id/rows?page&limit&q&sort=field:asc
POST   /api/tables/:id/rows              { "data": {...} }
PATCH  /api/tables/:id/rows/reorder      { "ids": ["row1","row2",...] }
PATCH  /api/tables/:id/rows/:rowId       { "data": {...} }
DELETE /api/tables/:id/rows/:rowId
```

`columns` is a JSON array of `{ key, label, type, multilingual?, hidden?, searchable? }`.

---

## Dashboard widgets (admin+)

```http
GET    /api/dashboard/widgets
POST   /api/dashboard/widgets         { "type": "line"|"bar", "title", "dataEndpoint", "config"? }
PATCH  /api/dashboard/widgets/reorder { "ids": [...] }
PATCH  /api/dashboard/widgets/:id
DELETE /api/dashboard/widgets/:id
```

`dataEndpoint` is any URL (including a dynamically-created one) returning
`[ { name: string, value: number }, ... ]`.

---

## Uploads (admin+)

```http
POST /api/uploads     multipart/form-data, field "file"
GET  /api/uploads/:filename
```

Response from POST:
```json
{ "url": "/api/uploads/1700000000000-abc123.png", "filename": "...", "mimeType": "...", "size": 12345 }
```

---

## Dynamic Endpoints (superadmin)

Define and manage runtime-registered endpoints.

```http
GET    /api/dynamic-endpoints
POST   /api/dynamic-endpoints
PATCH  /api/dynamic-endpoints/:id
DELETE /api/dynamic-endpoints/:id
```

Payload:
```jsonc
{
  "method": "GET",                      // GET|POST|PATCH|DELETE
  "path":   "/api/custom-users",        // must start with /api/
  "mode":   "static",                   // "static" or "db"
  "responseTemplate": { "users": [] },  // when mode = static
  "dbQueryConfig": {                    // when mode = db (safe, whitelisted)
    "table":   "users",
    "columns": ["id", "email"],
    "where":   { "role": "admin" },
    "orderBy": "created_at",
    "direction": "desc",
    "limit":   100
  },
  "enabled": true
}
```

### Engine (how it works)

`DynamicDispatcherController` is registered last in `AppModule`. NestJS's router matches static (decorated) controllers first, so dynamic paths only run when nothing else matches.

On startup and after every CRUD on `/api/dynamic-endpoints`, `DynamicEndpointsService` rebuilds an in-memory map keyed by `"METHOD:/api/path"`. The dispatcher:

- `static` → returns the saved JSON template.
- `db` → builds a **parameterized** SQL query, validating every identifier against `^[a-zA-Z_][a-zA-Z0-9_]*$`. Values are bound via parameters; identifiers are double-quoted. `LIMIT` is clamped to `[1, 1000]`.

There is **no raw SQL passthrough** from user input.

---

## Conventions

- Pagination: `?page=1&limit=25`, response `{ items, total, page, limit }`.
- Search: `?q=...` (free text against JSON cell content, server-side).
- Sort:   `?sort=field:asc` or `field:desc`.
- All IDs are UUIDs validated by `ParseUUIDPipe`.
