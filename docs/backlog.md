# Backlog / Known gaps (post-v0.4.0)

Status: stages 1–6 of the page-builder vision are shipped (`v0.4.0`). This file
tracks what is **not** covered by that vision or where the implementation
diverges from the spec, so a future session can pick it up as a fresh stage.

Legend — priority: 🔴 blocker · 🟠 high · 🟡 nice-to-have.

---

## A. UX / feature gaps reported from usage

These come from clicking through the live admin (News / Products sections).

### A1 🟠 Entries table is not draggable

- **Where:** [client/src/features/entries/EntriesList.tsx](../client/src/features/entries/EntriesList.tsx) renders a plain `<table>`; rows only navigate on click. No row reorder, no column reorder.
- **Missing:** drag-and-drop to reorder rows (and optionally columns) via `@dnd-kit/sortable`.
- **Backend impact:** `EntryEntity` has no persisted order field — list is `ORDER BY createdAt DESC`. Reordering needs a `displayOrder` (or `position`) column on entries + a PATCH/bulk-reorder endpoint, plus migration.
- **Column order:** columns are derived from the layout's field blocks; persisting a custom column order would need per-section column-config storage.

### A2 🟠 Creating a new section is not discoverable

- **Where:** section creation is only `CreateSectionDialog` reachable at `/settings/sections` ([SectionsPage](../client/src/pages/SectionsPage.tsx) → [SectionsList.tsx](../client/src/features/sections/SectionsList.tsx)). The sidebar ([Sidebar.tsx](../client/src/app/Sidebar.tsx)) lists existing sections but offers no "+ Add section" affordance.
- **Missing:** a visible entry point to create a section near the dynamic-sections nav (e.g. "+ New section" button in the sidebar group or on the sections landing page), superadmin-only.

### A3 🟠 Entry editor cannot rearrange elements

- **Where:** [client/src/features/entries/EntryEditor.tsx](../client/src/features/entries/EntryEditor.tsx) renders the section's layout as a read-only structure and binds inputs to entry `data`. Element reordering exists only in the section-builder (`/settings/sections/:id`).
- **Decision needed:**
  - (a) Keep layout strictly section-level and make that obvious in the UI (label/help text "layout is edited in Settings → Sections"), **or**
  - (b) allow per-entry layout overrides with the same DnD canvas as the builder (bigger change: entries would need to store their own `layout`).
- This is the root of why "rows/elements behave differently than Settings → Sections".

### A4 🔴 No nested / repeatable list fields (e.g. Header menu with submenus)

- **Where:** `FieldType` = `text | select | checkbox | switch | richtext | image | file | button` and `BlockType` = `typography | field | container | slider` ([client/src/shared/types/index.ts](../client/src/shared/types/index.ts)).
- **Missing:** a `repeater` / `list` field (an array of a sub-field-set), ideally **recursively nestable**, so structures like a navigation menu → items → sub-items can be modelled and exposed via the generated REST API.
- **Scope:** new field type + property panel + renderer in both section-builder and EntryEditor + Zod schema support in [entryData.ts](../client/src/features/entries/entryData.ts) + serialization is already generic `jsonb`, so the API likely needs no change beyond locale-collapsing arrays.
- Marked blocker because it is the one requested capability with no current workaround.

### A5 🟡 Easier flex / "several elements on one row"

- **Partially done:** `container` blocks support `layout.direction=row`, `gap`, `justify/align`, and field `width` (`100% | 50% | 33% | auto`) via `layoutToCss` / `widthCss` ([EntryEditor.tsx](../client/src/features/entries/EntryEditor.tsx), [propertyPanels/LayoutProps.tsx](../client/src/features/section-builder/propertyPanels/LayoutProps.tsx)).
- **Gap is UX:** it is not obvious that to put elements on one row you must wrap them in a `container` set to `row`. Standalone (non-container) elements cannot go inline.
- **Missing:** a quicker affordance — e.g. multi-select blocks → "group into row", or a drop-zone that creates a row container automatically; clearer hint in the palette/property panel.

---

## B. Spec divergences found during stage 6 review

### B1 🔴 No Postgres migrations

- `server/src/migrations/` does not exist. Dev (SQLite) relies on `synchronize: true`; production (`docker-compose.prod.yml`, Postgres) has nothing to build the schema from.
- **Action:** generate an initial migration covering `users`, `sections`, `entries`, `layout_templates` (+ legacy tables still in use) and wire `migration:run` into the prod startup/deploy.

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

1. **A4** (repeater fields) + **A2** (discoverable section creation) — biggest user-facing value.
2. **B1** (Postgres migrations) — before any production deploy.
3. **A1 / A3** (table DnD + entry-editor reorder decision) — depends on the A3 design choice.
4. **A5 / B2 / B3** — polish.
