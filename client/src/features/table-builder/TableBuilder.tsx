import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Typography } from '@shared/ui/Typography';
import { DataTable } from './DataTable';
import type { TableColumnDef, TableRow } from './types';

const DEMO_COLUMNS: TableColumnDef[] = [
  { key: 'name', label: 'Name', type: 'text', multilingual: true },
  { key: 'email', label: 'Email', type: 'text' },
  { key: 'active', label: 'Active', type: 'boolean' },
  { key: 'role', label: 'Role', type: 'text' },
];

const DEMO_ROWS: TableRow[] = Array.from({ length: 12 }, (_, i) => ({
  id: `r${i + 1}`,
  order: i,
  data: {
    name: { hy: `Անուն ${i + 1}`, ru: `Имя ${i + 1}`, en: `Name ${i + 1}` },
    email: `user${i + 1}@example.com`,
    active: i % 2 === 0,
    role: i === 0 ? 'superadmin' : 'user',
  },
}));

export function TableBuilder() {
  const { t } = useTranslation('admin');
  const [columns, setColumns] = useState<TableColumnDef[]>(DEMO_COLUMNS);
  const [rows, setRows] = useState<TableRow[]>(DEMO_ROWS);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sort, setSort] = useState<{ key: string; dir: 'asc' | 'desc' } | undefined>();
  const [search, setSearch] = useState<Record<string, string>>({});

  const filtered = rows.filter((r) =>
    Object.entries(search).every(([key, q]) => {
      if (!q) return true;
      const cell = r.data[key];
      const flat =
        typeof cell === 'object' && cell !== null
          ? Object.values(cell as Record<string, unknown>).join(' ')
          : String(cell ?? '');
      return flat.toLowerCase().includes(q.toLowerCase());
    }),
  );

  const sorted = sort
    ? [...filtered].sort((a, b) => {
        const ka = String(a.data[sort.key] ?? '');
        const kb = String(b.data[sort.key] ?? '');
        return sort.dir === 'asc' ? ka.localeCompare(kb) : kb.localeCompare(ka);
      })
    : filtered;

  const pageRows = sorted.slice((page - 1) * pageSize, page * pageSize);

  function handleRowsReorder(ids: string[]) {
    const map = new Map(rows.map((r) => [r.id, r]));
    setRows(ids.map((id, i) => ({ ...(map.get(id) as TableRow), order: i })));
  }

  function handleSort(key: string) {
    setSort((prev) =>
      prev?.key === key
        ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: 'asc' },
    );
  }

  return (
    <div>
      <Typography variant="h2" className="page-title">
        {t('nav.tables')}
      </Typography>

      <DataTable
        columns={columns}
        rows={pageRows}
        total={sorted.length}
        page={page}
        pageSize={pageSize}
        onColumnsChange={setColumns}
        onRowsReorder={handleRowsReorder}
        onSort={handleSort}
        onSearchChange={(s) => {
          setSearch(s);
          setPage(1);
        }}
        onPageChange={setPage}
        onPageSizeChange={(s) => {
          setPageSize(s);
          setPage(1);
        }}
        sort={sort}
      />
    </div>
  );
}
