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
