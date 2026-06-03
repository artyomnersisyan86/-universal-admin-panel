import { apiClient } from '@shared/lib/apiClient';

export type EntryStatus = 'draft' | 'published';

/**
 * Entry as serialized by the server's per-section dispatcher (`/api/:slug`).
 * `data` is the full multilingual payload (no `?lang=` narrowing) so the editor
 * can round-trip every locale.
 */
export interface Entry {
  id: string;
  sectionId: string;
  sectionSlug: string;
  status: EntryStatus;
  data: Record<string, unknown>;
  displayOrder: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEntryPayload {
  data: Record<string, unknown>;
  status?: EntryStatus;
}

export interface UpdateEntryPayload {
  data?: Record<string, unknown>;
  status?: EntryStatus;
}

/**
 * Entries are addressed through the universal section dispatcher. With an admin
 * JWT a bare `GET /:slug` returns every status; `?status=` narrows it.
 */
export const entriesApi = {
  list: (slug: string, status?: EntryStatus) =>
    apiClient
      .get<Entry[]>(`/${slug}`, { params: status ? { status } : undefined })
      .then((r) => r.data),

  get: (slug: string, id: string) =>
    apiClient.get<Entry>(`/${slug}/${id}`).then((r) => r.data),

  create: (slug: string, dto: CreateEntryPayload) =>
    apiClient.post<Entry>(`/${slug}`, dto).then((r) => r.data),

  update: (slug: string, id: string, dto: UpdateEntryPayload) =>
    apiClient.patch<Entry>(`/${slug}/${id}`, dto).then((r) => r.data),

  publish: (slug: string, id: string) =>
    apiClient.post<Entry>(`/${slug}/${id}/publish`, {}).then((r) => r.data),

  remove: (slug: string, id: string) =>
    apiClient.delete<void>(`/${slug}/${id}`).then((r) => r.data),

  reorder: (slug: string, ids: string[]) =>
    apiClient.patch<void>(`/${slug}/reorder`, { ids }).then((r) => r.data),
};
