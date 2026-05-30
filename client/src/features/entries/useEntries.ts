import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  entriesApi,
  type CreateEntryPayload,
  type UpdateEntryPayload,
} from '@shared/api/entries';

export const entriesKey = (slug: string) => ['entries', slug] as const;
export const entryKey = (slug: string, id: string) => ['entries', slug, id] as const;

export function useEntriesList(slug: string | undefined) {
  return useQuery({
    queryKey: slug ? entriesKey(slug) : ['entries', 'none'],
    queryFn: () => entriesApi.list(slug as string),
    enabled: Boolean(slug),
  });
}

export function useEntry(slug: string | undefined, id: string | undefined) {
  return useQuery({
    queryKey: slug && id ? entryKey(slug, id) : ['entries', 'none', 'none'],
    queryFn: () => entriesApi.get(slug as string, id as string),
    enabled: Boolean(slug && id),
  });
}

export function useCreateEntry(slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateEntryPayload) => entriesApi.create(slug, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: entriesKey(slug) });
    },
  });
}

export function useUpdateEntry(slug: string, id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateEntryPayload) => entriesApi.update(slug, id, payload),
    onSuccess: (data) => {
      qc.setQueryData(entryKey(slug, id), data);
      void qc.invalidateQueries({ queryKey: entriesKey(slug) });
    },
  });
}

export function usePublishEntry(slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => entriesApi.publish(slug, id),
    onSuccess: (data) => {
      qc.setQueryData(entryKey(slug, data.id), data);
      void qc.invalidateQueries({ queryKey: entriesKey(slug) });
    },
  });
}

export function useDeleteEntry(slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => entriesApi.remove(slug, id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: entriesKey(slug) });
    },
  });
}
