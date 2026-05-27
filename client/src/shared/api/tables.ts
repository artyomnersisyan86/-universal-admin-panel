import { apiClient } from '@shared/lib/apiClient';
import type {
  PaginatedResponse,
  TableColumnDef,
  TableDefinition,
  TableRow,
} from '@shared/types';

export interface CreateTablePayload {
  name: string;
  columns: TableColumnDef[];
}

export interface RowListParams {
  page?: number;
  limit?: number;
  q?: string;
  sort?: string;
}

export const tablesApi = {
  list: () => apiClient.get<TableDefinition[]>('/tables').then((r) => r.data),

  create: (dto: CreateTablePayload) =>
    apiClient.post<TableDefinition>('/tables', dto).then((r) => r.data),

  update: (id: string, dto: CreateTablePayload) =>
    apiClient.patch<TableDefinition>(`/tables/${id}`, dto).then((r) => r.data),

  remove: (id: string) => apiClient.delete<void>(`/tables/${id}`).then((r) => r.data),

  listRows: (id: string, params: RowListParams = {}) =>
    apiClient
      .get<PaginatedResponse<TableRow>>(`/tables/${id}/rows`, { params })
      .then((r) => r.data),

  addRow: (id: string, data: Record<string, unknown>) =>
    apiClient.post<TableRow>(`/tables/${id}/rows`, { data }).then((r) => r.data),

  updateRow: (tableId: string, rowId: string, data: Record<string, unknown>) =>
    apiClient
      .patch<TableRow>(`/tables/${tableId}/rows/${rowId}`, { data })
      .then((r) => r.data),

  removeRow: (tableId: string, rowId: string) =>
    apiClient.delete<void>(`/tables/${tableId}/rows/${rowId}`).then((r) => r.data),

  reorder: (id: string, ids: string[]) =>
    apiClient.patch<{ ok: true }>(`/tables/${id}/rows/reorder`, { ids }).then((r) => r.data),
};
