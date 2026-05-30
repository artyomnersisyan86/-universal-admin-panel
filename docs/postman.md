# Testing the API with Postman

A ready-to-import collection lives in [`docs/postman/`](postman/):

- `universal-admin-panel.postman_collection.json` — all requests, grouped by feature
- `universal-admin-panel.postman_environment.json` — variables (base URL, credentials, captured IDs)

## Import

1. Postman → **Import** → drop both JSON files.
2. Top-right environment selector → pick **UAP — Local (dev)**.
3. Set `baseUrl` for your setup:
   - `http://localhost:3000` — server run directly (`npm --workspace server run start:dev`)
   - `http://localhost` — full Docker stack (Nginx fronts `/api`)

The default credentials (`admin@example.com` / `admin`) match the seeded superadmin.

## Happy-path run order

The collection auto-captures IDs into collection variables via test scripts, so run top-to-bottom:

1. **Auth → Login** — stores `{{token}}`; every other request sends `Authorization: Bearer {{token}}` automatically.
2. **Sections → Create section (superadmin)** — stores `{{sectionId}}` and `{{sectionSlug}}` (defaults to `news`).
3. **Entries → Create entry (admin)** — stores `{{entryId}}` as a `draft`.
4. **Entries → Get entry detail** / **Update entry** — read & edit while still a draft.
5. **Entries → Publish entry** — flips it to `published`.
6. **Entries → List entries (public)** — run with the `Authorization` header off (the request is already `noauth`) to confirm only published entries are visible anonymously.
7. **Entries → Delete entry**, then **Sections → Delete section** to clean up (deleting the section cascades to its entries).

## Things to try

- `GET /api/{{sectionSlug}}?lang=hy` — multilingual fields collapse to a single locale.
- `GET /api/{{sectionSlug}}?status=draft` (with token) — admins see unpublished entries.
- Hit `GET /api/{{sectionSlug}}` with no token on a section whose `isPublic` is `false` → `401`.
- **Uploads → Upload file** — pick a file in the `file` form-data field first; copy the returned `filename` into **Fetch file**.

## Automated alternative

The same flows are covered by the server e2e suite (`server/test/*.e2e-spec.ts`):

```powershell
npm --workspace server run test
```

This spins up the full Nest app against a throwaway SQLite DB — no running server or Postman needed.
