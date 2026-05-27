import { useMemo, useState } from 'react';
import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToHorizontalAxis, restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { useTranslation } from 'react-i18next';
import { Button } from '@shared/ui/Button';
import { TextInput } from '@shared/ui/TextInput';
import type { TableColumnDef, TableRow } from './types';
import './DataTable.css';

interface DataTableProps {
  columns: TableColumnDef[];
  rows: TableRow[];
  page: number;
  pageSize: number;
  total: number;
  onColumnsChange: (next: TableColumnDef[]) => void;
  onRowsReorder: (rowIds: string[]) => void;
  onSort: (key: string) => void;
  onSearchChange: (search: Record<string, string>) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  sort?: { key: string; dir: 'asc' | 'desc' };
  onRowEdit?: (row: TableRow) => void;
  onRowDelete?: (row: TableRow) => void;
}

export function DataTable({
  columns,
  rows,
  page,
  pageSize,
  total,
  onColumnsChange,
  onRowsReorder,
  onSort,
  onSearchChange,
  onPageChange,
  onPageSizeChange,
  sort,
  onRowEdit,
  onRowDelete,
}: DataTableProps) {
  const { t } = useTranslation(['admin', 'common']);
  const [showColSearch, setShowColSearch] = useState(false);
  const [showVisibility, setShowVisibility] = useState(false);
  const [colSearch, setColSearch] = useState<Record<string, string>>({});

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const visibleColumns = useMemo(() => columns.filter((c) => !c.hidden), [columns]);

  function handleColumnDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = columns.findIndex((c) => c.key === active.id);
    const newIndex = columns.findIndex((c) => c.key === over.id);
    if (oldIndex !== -1 && newIndex !== -1) {
      onColumnsChange(arrayMove(columns, oldIndex, newIndex));
    }
  }

  function handleRowDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = rows.findIndex((r) => r.id === active.id);
    const newIndex = rows.findIndex((r) => r.id === over.id);
    if (oldIndex !== -1 && newIndex !== -1) {
      onRowsReorder(arrayMove(rows.map((r) => r.id), oldIndex, newIndex));
    }
  }

  function toggleColumn(key: string) {
    onColumnsChange(columns.map((c) => (c.key === key ? { ...c, hidden: !c.hidden } : c)));
  }

  function updateSearch(key: string, value: string) {
    const next = { ...colSearch, [key]: value };
    setColSearch(next);
    onSearchChange(next);
  }

  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="data-table">
      <div className="data-table__toolbar">
        <Button
          variant="outlined"
          size="small"
          onClick={() => setShowColSearch((v) => !v)}
        >
          {t('admin:table.perColumnSearch')}
        </Button>
        <Button
          variant="outlined"
          size="small"
          onClick={() => setShowVisibility((v) => !v)}
        >
          {t('admin:table.columnVisibility')}
        </Button>
        <Button
          variant="text"
          size="small"
          onClick={() =>
            navigator.clipboard.writeText(JSON.stringify(rows.map((r) => r.data), null, 2))
          }
        >
          {t('common:app.copyJson')}
        </Button>

        {showVisibility && (
          <div className="data-table__visibility">
            {columns.map((c) => (
              <label key={c.key} className="data-table__vis-row">
                <input
                  type="checkbox"
                  checked={!c.hidden}
                  onChange={() => toggleColumn(c.key)}
                />
                <span>{c.label}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="data-table__wrapper">
        {/* Column drag context */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[restrictToHorizontalAxis]}
          onDragEnd={handleColumnDragEnd}
        >
          <table className="data-table__table">
            <thead>
              <tr>
                <th className="data-table__th-handle" />
                <SortableContext
                  items={visibleColumns.map((c) => c.key)}
                  strategy={horizontalListSortingStrategy}
                >
                  {visibleColumns.map((col) => (
                    <SortableColumnHeader
                      key={col.key}
                      column={col}
                      sort={sort}
                      onSort={() => onSort(col.key)}
                    />
                  ))}
                </SortableContext>
                {(onRowEdit || onRowDelete) && (
                  <th className="data-table__th data-table__th-actions" />
                )}
              </tr>
              {showColSearch && (
                <tr>
                  <th className="data-table__th-handle" />
                  {visibleColumns.map((col) => (
                    <th key={col.key} className="data-table__th-search">
                      <TextInput
                        placeholder={t('common:app.search')}
                        value={colSearch[col.key] ?? ''}
                        onChange={(e) => updateSearch(col.key, e.target.value)}
                      />
                    </th>
                  ))}
                  {(onRowEdit || onRowDelete) && <th />}
                </tr>
              )}
            </thead>

            {/* Row drag context */}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              modifiers={[restrictToVerticalAxis]}
              onDragEnd={handleRowDragEnd}
            >
              <SortableContext
                items={rows.map((r) => r.id)}
                strategy={verticalListSortingStrategy}
              >
                <tbody>
                  {rows.length === 0 && (
                    <tr>
                      <td
                        colSpan={visibleColumns.length + 1 + (onRowEdit || onRowDelete ? 1 : 0)}
                        className="data-table__empty"
                      >
                        {t('admin:table.noData')}
                      </td>
                    </tr>
                  )}
                  {rows.map((row) => (
                    <SortableRow
                      key={row.id}
                      row={row}
                      columns={visibleColumns}
                      onEdit={onRowEdit}
                      onDelete={onRowDelete}
                    />
                  ))}
                </tbody>
              </SortableContext>
            </DndContext>
          </table>
        </DndContext>
      </div>

      <div className="data-table__pagination">
        <span>
          {t('admin:table.rowsPerPage')}:{' '}
          <select value={pageSize} onChange={(e) => onPageSizeChange(Number(e.target.value))}>
            {[10, 25, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </span>
        <span>
          {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
        </span>
        <div className="data-table__pager">
          <Button size="small" variant="outlined" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
            ‹
          </Button>
          <Button
            size="small"
            variant="outlined"
            disabled={page >= pageCount}
            onClick={() => onPageChange(page + 1)}
          >
            ›
          </Button>
        </div>
      </div>
    </div>
  );
}

function SortableColumnHeader({
  column,
  sort,
  onSort,
}: {
  column: TableColumnDef;
  sort?: { key: string; dir: 'asc' | 'desc' };
  onSort: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: column.key,
  });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const isSorted = sort?.key === column.key;
  return (
    <th
      ref={setNodeRef}
      style={style}
      className={`data-table__th${isDragging ? ' data-table__th--dragging' : ''}`}
    >
      <div className="data-table__th-inner">
        <span className="data-table__th-handle-icon" {...attributes} {...listeners}>
          ⋮⋮
        </span>
        <button type="button" className="data-table__th-label" onClick={onSort}>
          {column.label}
          {isSorted && <span>{sort?.dir === 'asc' ? ' ▲' : ' ▼'}</span>}
        </button>
      </div>
    </th>
  );
}

function SortableRow({
  row,
  columns,
  onEdit,
  onDelete,
}: {
  row: TableRow;
  columns: TableColumnDef[];
  onEdit?: (r: TableRow) => void;
  onDelete?: (r: TableRow) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: row.id,
  });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={isDragging ? 'data-table__tr--dragging' : undefined}
    >
      <td className="data-table__td-handle">
        <span {...attributes} {...listeners} className="data-table__row-handle">
          ⋮⋮
        </span>
      </td>
      {columns.map((c) => (
        <td key={c.key} className="data-table__td">
          {renderCell(row.data[c.key], c)}
        </td>
      ))}
      {(onEdit || onDelete) && (
        <td className="data-table__td data-table__td-actions">
          {onEdit && (
            <Button size="small" variant="text" onClick={() => onEdit(row)}>
              ✎
            </Button>
          )}
          {onDelete && (
            <Button size="small" variant="text" onClick={() => onDelete(row)}>
              🗑
            </Button>
          )}
        </td>
      )}
    </tr>
  );
}

function renderCell(value: unknown, col: TableColumnDef): string {
  if (value == null) return '';
  if (col.multilingual && typeof value === 'object') {
    const obj = value as Record<string, string>;
    return obj.hy || obj.ru || obj.en || '';
  }
  if (col.type === 'boolean') return value ? '✓' : '×';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}
