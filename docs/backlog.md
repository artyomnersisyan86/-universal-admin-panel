# Backlog / Known gaps (post-v0.4.0)

Status: stages 1–6 of the page-builder vision are shipped (`v0.4.0`). This file
tracks what is **not** covered by that vision or where the implementation
diverges from the spec, so a future session can pick it up as a fresh stage.

Legend — priority: 🔴 blocker · 🟠 high · 🟡 nice-to-have.

---

## A. UX / feature gaps reported from usage

These come from clicking through the live admin (News / Products sections).

### ~~A1~~ ✅ Entries table is not draggable — **DONE**

- `EntryEntity.displayOrder` column added (default 0, `ORDER BY displayOrder ASC, createdAt DESC`).
- `EntriesService.reorder()` + `PATCH /:sectionSlug/reorder` endpoint (admin-only).
- `EntriesList` wrapped in `DndContext` / `SortableContext` (`@dnd-kit/sortable`); each row has a `⠿` drag handle; optimistic reorder with server sync on drag-end.
- **Column order** still not persisted — needs per-section column-config storage (separate task).

### ~~A2~~ ✅ Creating a new section is not discoverable — **DONE**

- `+` button in the sidebar SECTIONS group opens `CreateSectionDialog` as an inline modal overlay (portal to `document.body`). Superadmin-only. After save → redirect to section builder. Empty-state hint shown when 0 sections.

### ~~A3~~ ✅ Entry editor cannot rearrange elements — **DONE**

- **Decision taken:** option (a) — layout stays strictly section-level.
- **Rationale:** spec Decision #A mandates `layout` is stored per-section. Per-entry overrides would give each `news` entry a different schema, breaking the auto-generated `/api/news` list contract.
- **Change:** `EntryEditor` now shows a passive info banner — _"Layout structure is managed in Settings → Sections"_ — with a direct link to `/settings/sections/:id`. Translated in hy/ru/en.

### ~~A4~~ ✅ No nested / repeatable list fields — **DONE**

- `repeater` field type added to `FieldType`, section-builder property panel, `FieldRenderer`, and `EntryEditor`. Supports sub-fields (name/label/type), add/remove rows, move up/down.

### A5 🟡 Easier flex / "several elements on one row"

- **Partially done:** `container` blocks support `layout.direction=row`, `gap`, `justify/align`, and field `width` (`100% | 50% | 33% | auto`) via `layoutToCss` / `widthCss` ([EntryEditor.tsx](../client/src/features/entries/EntryEditor.tsx), [propertyPanels/LayoutProps.tsx](../client/src/features/section-builder/propertyPanels/LayoutProps.tsx)).
- **Gap is UX:** it is not obvious that to put elements on one row you must wrap them in a `container` set to `row`. Standalone (non-container) elements cannot go inline.
- **Missing:** a quicker affordance — e.g. multi-select blocks → "group into row", or a drop-zone that creates a row container automatically; clearer hint in the palette/property panel.

---

## B. Spec divergences found during stage 6 review

### ~~B1~~ ✅ No Postgres migrations — **DONE**

- `server/src/migrations/1780531200000-InitialSchema.ts` — initial migration covering all 9 tables: `users`, `sections`, `entries`, `layout_templates`, `form_schemas`, `table_definitions`, `table_rows`, `dashboard_widgets`, `dynamic_endpoints`.
- `typeorm.config.ts` Postgres branch: `synchronize: false`, `migrationsRun: true`, `migrations: [path.join(__dirname, '..', 'migrations', '*.{ts,js}')]` — migrations auto-run on NestJS startup (no Dockerfile changes needed).
- SQLite dev path unchanged (`synchronize: !isProd`).

### B2 🟡 `GET /api/:slug/:id` does not return `layout`

- Spec §7 / acceptance #6 expects the detail response to include `layout` + `data`. [entries.service.ts](../server/src/modules/entries/entries.service.ts) `serialize()` returns `sectionSlug`, `data`, `status`, timestamps — **no layout**. Clients fetch layout separately via `/api/sections/:id`.
- **Action:** either embed the section layout in the entry detail response (optionally behind `?include=layout`) or update the spec to document the two-call pattern.

### B3 🟡 Upload limit default is 10 MB, spec says 5

- Decision E fixes `MAX_UPLOAD_MB=5`; code default and `.env.example` / both compose files use `10` ([uploads.controller.ts](../server/src/modules/uploads/uploads.controller.ts)).
- **Action:** one-line change to align the default (or amend the spec to 10).

---

## C. Consciously deferred (per the spec itself)

- **Entry change history / versioning** — spec decision B: "нет, можно добавить позже".
- **Server-side media processing** (resize / webp) — spec decision E: stored as uploaded.

---

## Suggested order for the next stage

1. ~~**A4** (repeater fields) + **A2** (discoverable section creation)~~ ✅ Done.
2. ~~**B1** (Postgres migrations)~~ ✅ Done.
3. ~~**A1 / A3**~~ ✅ Done.
4. **A5 / B2 / B3** — polish.
