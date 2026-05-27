# REST API

Base URL: `/api` (Nginx routes it to the NestJS server).
All non-public endpoints require `Authorization: Bearer <jwt>`.

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

## Form schemas (admin+)

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
