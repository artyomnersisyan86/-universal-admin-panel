import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { sectionsApi, type CreateSectionPayload, type UpdateSectionPayload } from '@shared/api/sections';

export const sectionsKey = ['sections'] as const;
export const sectionKey = (id: string) => ['sections', id] as const;

export function useSectionsList() {
  return useQuery({
    queryKey: sectionsKey,
    queryFn: () => sectionsApi.list(),
  });
}

export function useSection(id: string | undefined) {
  return useQuery({
    queryKey: id ? sectionKey(id) : ['sections', 'none'],
    queryFn: () => sectionsApi.get(id as string),
    enabled: Boolean(id),
  });
}

/**
 * Resolve a section by its URL slug off the cached list — used by the content
 * routes (`/c/:slug`), which only know the slug. Returns the same query state
 * shape so callers can branch on loading/error/data.
 */
export function useSectionBySlug(slug: string | undefined) {
  const list = useSectionsList();
  const section = slug ? list.data?.find((s) => s.slug === slug) : undefined;
  return { ...list, section } as typeof list & { section: typeof section };
}

export function useCreateSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSectionPayload) => sectionsApi.create(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: sectionsKey });
    },
  });
}

export function useUpdateSection(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateSectionPayload) => sectionsApi.update(id, payload),
    onSuccess: (data) => {
      qc.setQueryData(sectionKey(id), data);
      void qc.invalidateQueries({ queryKey: sectionsKey });
    },
  });
}

export function useDeleteSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => sectionsApi.remove(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: sectionsKey });
    },
  });
}
