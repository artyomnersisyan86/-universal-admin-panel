import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Typography } from '@shared/ui/Typography';
import { Button } from '@shared/ui/Button';
import { tablesApi } from '@shared/api/tables';
import type { TableColumnDef, TableDefinition, TableRow } from '@shared/types';
import { DataTable } from './DataTable';
import { RowFormDialog } from './RowFormDialog';
import { ColumnEditorDialog } from './ColumnEditorDialog';
import './TableEditor.css';

interface Props {
  tableId: string;
}

type Dialog =
  | { kind: 'row-add' }
  | { kind: 'row-edit'; row: TableRow }
  | { kind: 'schema' }
  | null;

export function TableEditor({ tableId }: Props) {
  const { t } = useTranslation(['admin', 'common']);
  const navigate = useNavigate();
  const [def, setDef] = useState<TableDefinition | null>(null);
  const [rows, setRows] = useState<TableRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sort, setSort] = useState<{ key: string; dir: 'asc' | 'desc' } | undefined>();
  const [search, setSearch] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialog, setDialog] = useState<Dialog>(null);

  const fetchRows = useCallback(async () => {
    setError(null);
    const q = Object.values(search).filter(Boolean).join(' ').trim() || undefined;
    const sortParam = sort ? `${sort.key}:${sort.dir}` : undefined;
    try {
      const resp = await tablesApi.listRows(tableId, { page, limit: pageSize, q, sort: sortParam });
      setRows(resp.items);
      setTotal(resp.total);
    } catch (e) {
      setError(extractMsg(e) ?? t('common:app.error'));
    }
  }, [tableId, page, pageSize, sort, search, t]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    tablesApi
      .list()
      .then((all) => {
        if (cancelled) return;
        const found = all.find((tb) => tb.id === tableId);
        if (!found) {
          setError(t('admin:tables.notFound'));
          return;
        }
        setDef(found);
      })
      .catch((e) => !cancelled && setError(extractMsg(e) ?? t('common:app.error')))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [tableId, t]);

  useEffect(() => {
    if (def) void fetchRows();
  }, [def, fetchRows]);

  if (loading) return <p>{t('common:app.loading')}…</p>;
  if (error && !def) {
    return (
      <div>
        <p style={{ color: 'var(--danger, #c0392b)' }}>{error}</p>
        <Button variant="outlined" onClick={() => navigate('/settings/tables')}>
          ← {t('admin:tables.backToList')}
        </Button>
      </div>
    );
  }
  if (!def) return null;

  async function handleAdd(data: Record<string, unknown>) {
    const optimistic: TableRow = {
      id: `tmp-${Date.now()}`,
      order: rows.length,
      data,
    };
    setRows((prev) => [...prev, optimistic]);
    setTotal((n) => n + 1);
    try {
      await tablesApi.addRow(tableId, data);
      await fetchRows();
    } catch (e) {
      setRows((prev) => prev.filter((r) => r.id !== optimistic.id));
      setTotal((n) => n - 1);
      setError(extractMsg(e) ?? t('common:app.error'));
    }
  }

  async function handleEdit(rowId: string, data: Record<string, unknown>) {
    const prevRows = rows;
    setRows((rs) => rs.map((r) => (r.id === rowId ? { ...r, data } : r)));
    try {
      await tablesApi.updateRow(tableId, rowId, data);
    } catch (e) {
      setRows(prevRows);
      setError(extractMsg(e) ?? t('common:app.error'));
    }
  }

  async function handleDelete(row: TableRow) {
    if (!window.confirm(t('admin:tables.confirmDeleteRow'))) return;
    const prevRows = rows;
    setRows((rs) => rs.filter((r) => r.id !== row.id));
    setTotal((n) => n - 1);
    try {
      await tablesApi.removeRow(tableId, row.id);
    } catch (e) {
      setRows(prevRows);
      setTotal((n) => n + 1);
      setError(extractMsg(e) ?? t('common:app.error'));
    }
  }

  async function handleReorder(ids: string[]) {
    const prevRows = rows;
    setRows(() => {
      const map = new Map(prevRows.map((r) => [r.id, r]));
      return ids.map((id, i) => ({ ...(map.get(id) as TableRow), order: i }));
    });
    try {
      await tablesApi.reorder(tableId, ids);
    } catch (e) {
      setRows(prevRows);
      setError(extractMsg(e) ?? t('common:app.error'));
    }
  }

  function handleSort(key: string) {
    setSort((prev) =>
      prev?.key === key
        ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: 'asc' },
    );
  }

  async function handleColumnsChange(next: TableColumnDef[]) {
    const current = def;
    if (!current) return;
    setDef({ ...current, columns: next });
    try {
      await tablesApi.update(tableId, { name: current.name, columns: next });
    } catch (e) {
      setDef(current);
      setError(extractMsg(e) ?? t('common:app.error'));
    }
  }

  async function handleSchemaSave({ name, columns }: { name: string; columns: TableColumnDef[] }) {
    const current = def;
    if (!current) return;
    const saved = await tablesApi.update(tableId, { name, columns });
    setDef(saved);
  }

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 'var(--space-4)',
          gap: 'var(--space-3)',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <Button variant="text" size="small" onClick={() => navigate('/settings/tables')}>
            ← {t('admin:nav.tables')}
          </Button>
          <Typography variant="h2" className="page-title">
            {def.name}
          </Typography>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <Button variant="outlined" onClick={() => setDialog({ kind: 'schema' })}>
            {t('admin:tables.editSchema')}
          </Button>
          <Button onClick={() => setDialog({ kind: 'row-add' })}>
            + {t('admin:table.addRow')}
          </Button>
        </div>
      </div>

      {error && <p style={{ color: 'var(--danger, #c0392b)' }}>{error}</p>}

      {(() => {
        const hasSearch = Object.values(search).some(Boolean);
        const showEmpty = total === 0 && !hasSearch;
        if (showEmpty) {
          return (
            <div className="table-editor__empty-state">
              <div className="table-editor__empty-icon" aria-hidden>
                ✨
              </div>
              <Typography variant="h3">{t('admin:tables.rowsEmptyTitle')}</Typography>
              <p className="table-editor__empty-desc">
                {t('admin:tables.rowsEmptyDescription')}
              </p>
              <p
                className="table-editor__tip"
                dangerouslySetInnerHTML={{ __html: t('admin:tables.editorTip') }}
              />
              <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'center' }}>
                <Button variant="outlined" onClick={() => setDialog({ kind: 'schema' })}>
                  {t('admin:tables.editSchema')}
                </Button>
                <Button onClick={() => setDialog({ kind: 'row-add' })}>
                  + {t('admin:tables.rowsEmptyCta')}
                </Button>
              </div>
            </div>
          );
        }
        return (
          <DataTable
            columns={def.columns}
            rows={rows}
            total={total}
            page={page}
            pageSize={pageSize}
            sort={sort}
            onColumnsChange={handleColumnsChange}
            onRowsReorder={handleReorder}
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
            onRowEdit={(row) => setDialog({ kind: 'row-edit', row })}
            onRowDelete={handleDelete}
          />
        );
      })()}

      {dialog?.kind === 'row-add' && (
        <RowFormDialog
          columns={def.columns}
          initialRow={null}
          title={t('admin:tables.addRowTitle')}
          submitLabel={t('common:app.create')}
          onSubmit={handleAdd}
          onClose={() => setDialog(null)}
        />
      )}

      {dialog?.kind === 'row-edit' && (
        <RowFormDialog
          columns={def.columns}
          initialRow={dialog.row}
          title={t('admin:tables.editRowTitle')}
          submitLabel={t('common:app.save')}
          onSubmit={(data) => handleEdit(dialog.row.id, data)}
          onClose={() => setDialog(null)}
        />
      )}

      {dialog?.kind === 'schema' && (
        <ColumnEditorDialog
          tableName={def.name}
          columns={def.columns}
          onSave={handleSchemaSave}
          onClose={() => setDialog(null)}
        />
      )}
    </div>
  );
}

function extractMsg(e: unknown): string | undefined {
  return (e as { response?: { data?: { message?: string } } }).response?.data?.message;
}
