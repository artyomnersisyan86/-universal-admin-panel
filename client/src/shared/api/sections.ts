import { apiClient } from '@shared/lib/apiClient';
import type { LayoutTree, Multilingual, Section } from '@shared/types';

export interface CreateSectionPayload {
  slug: string;
  name: Multilingual<string>;
  layout: LayoutTree;
  isPublic?: boolean;
  displayOrder?: number;
  icon?: string | null;
}

export interface UpdateSectionPayload {
  slug?: string;
  name?: Multilingual<string>;
  layout?: LayoutTree;
  isPublic?: boolean;
  displayOrder?: number;
  icon?: string | null;
}

export const sectionsApi = {
  list: () => apiClient.get<Section[]>('/sections').then((r) => r.data),

  get: (id: string) => apiClient.get<Section>(`/sections/${id}`).then((r) => r.data),

  create: (dto: CreateSectionPayload) =>
    apiClient.post<Section>('/sections', dto).then((r) => r.data),

  update: (id: string, dto: UpdateSectionPayload) =>
    apiClient.patch<Section>(`/sections/${id}`, dto).then((r) => r.data),

  remove: (id: string) => apiClient.delete<void>(`/sections/${id}`).then((r) => r.data),
};
