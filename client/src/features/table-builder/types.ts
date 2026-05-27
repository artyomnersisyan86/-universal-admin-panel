export type { TableColumnDef, TableColumnType, TableRow } from '@shared/types';

export interface TableState {
  columns: import('@shared/types').TableColumnDef[];
  rows: import('@shared/types').TableRow[];
  page: number;
  pageSize: number;
  total: number;
  sort?: { key: string; dir: 'asc' | 'desc' };
  columnSearch?: Record<string, string>;
  showColumnSearch?: boolean;
}
