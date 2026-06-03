import { useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  closestCenter,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Typography } from '@shared/ui/Typography';
import { Button } from '@shared/ui/Button';
import type { FieldDef, Multilingual, Section, SupportedLanguage } from '@shared/types';
import type { Entry } from '@shared/api/entries';
import { useDeleteEntry, useEntriesList, usePublishEntry, useReorderEntries } from './useEntries';
import { collectFieldDefs } from './entryData';
import './EntriesList.css';

const MAX_COLUMNS = 4;

interface Props {
  section: Section;
}

interface RowProps {
  entry: Entry;
  columns: FieldDef[];
  lang: SupportedLanguage;
  onOpen: (id: string) => void;
  onPublish: (id: string) => void;
  onDelete: (entry: Entry) => void;
  isPublishing: boolean;
  isDeleting: boolean;
  isDragOverlay?: boolean;
}

function SortableRow({
  entry,
  columns,
  lang,
  onOpen,
  onPublish,
  onDelete,
  isPublishing,
  isDeleting,
  isDragOverlay = false,
}: RowProps) {
  const { t } = useTranslation(['admin', 'common']);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: entry.id,
  });

  const style = isDragOverlay
    ? undefined
    : {
        transform: CSS.Transform.toString(transform),
        transition,
      };

  return (
    <tr
      ref={isDragOverlay ? undefined : setNodeRef}
      style={style}
      className={[
        'entries-list__row',
        isDragging ? 'entries-list__row--dragging' : '',
        isDragOverlay ? 'entries-list__row--overlay' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={() => onOpen(entry.id)}
    >
      <td className="entries-list__drag-cell" onClick={(e) => e.stopPropagation()}>
        <span
          className="entries-list__drag-handle"
          {...(isDragOverlay ? {} : { ...attributes, ...listeners })}
          title={t('admin:entries.dragToReorder')}
        >
          ⠿
        </span>
      </td>
      {columns.map((c) => (
        <td key={c.id}>{renderCell(c, entry.data[c.name], lang)}</td>
      ))}
      <td>
        <span className={`entries-list__status entries-list__status--${entry.status}`}>
          {t(`admin:entries.status.${entry.status}`)}
        </span>
      </td>
      <td className="entries-list__actions" onClick={(ev) => ev.stopPropagation()}>
        <Button size="small" variant="text" onClick={() => onOpen(entry.id)}>
          {t('common:app.edit')}
        </Button>
        {entry.status === 'draft' && (
          <Button
            size="small"
            variant="text"
            onClick={() => onPublish(entry.id)}
            disabled={isPublishing}
          >
            {t('admin:entries.publish')}
          </Button>
        )}
        <Button
          size="small"
          variant="text"
          onClick={() => onDelete(entry)}
          disabled={isDeleting}
        >
          {t('common:app.delete')}
        </Button>
      </td>
    </tr>
  );
}

export function EntriesList({ section }: Props) {
  const { t, i18n } = useTranslation(['admin', 'common']);
  const navigate = useNavigate();
  const lang = (i18n.resolvedLanguage as SupportedLanguage) || 'hy';

  const columns = useMemo(
    () => collectFieldDefs(section.layout?.root ?? []).filter((f) => f.type !== 'button').slice(0, MAX_COLUMNS),
    [section.layout],
  );

  const list = useEntriesList(section.slug);
  const publish = usePublishEntry(section.slug);
  const del = useDeleteEntry(section.slug);
  const reorder = useReorderEntries(section.slug);

  const [orderedIds, setOrderedIds] = useState<string[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (list.data) {
      setOrderedIds(list.data.map((e) => e.id));
    }
  }, [list.data]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const orderedEntries = useMemo(() => {
    if (!list.data) return [];
    const map = new Map(list.data.map((e) => [e.id, e]));
    return orderedIds.map((id) => map.get(id)).filter((e): e is Entry => Boolean(e));
  }, [list.data, orderedIds]);

  const activeEntry = useMemo(
    () => (activeId ? orderedEntries.find((e) => e.id === activeId) : null),
    [activeId, orderedEntries],
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveId(null);
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      setOrderedIds((prev) => {
        const oldIndex = prev.indexOf(String(active.id));
        const newIndex = prev.indexOf(String(over.id));
        const next = arrayMove(prev, oldIndex, newIndex);
        reorder.mutate(next);
        return next;
      });
    },
    [reorder],
  );

  function openEntry(id: string) {
    navigate(`/c/${section.slug}/${id}`);
  }

  async function handleDelete(e: Entry) {
    if (!window.confirm(t('admin:entries.confirmDelete'))) return;
    await del.mutateAsync(e.id);
  }

  return (
    <div className="entries-list">
      <header className="entries-list__header">
        <div>
          <Typography variant="h2">
            {section.name[lang] || section.name.en || section.slug}
          </Typography>
          <Typography variant="caption" className="entries-list__slug">
            <code>/api/{section.slug}</code>
          </Typography>
        </div>
        <Button onClick={() => navigate(`/c/${section.slug}/new`)}>
          {t('admin:entries.create')}
        </Button>
      </header>

      {list.isLoading && <Typography variant="caption">{t('common:app.loading')}</Typography>}
      {list.error && (
        <Typography variant="caption" className="entries-list__error">
          ⚠ {(list.error as Error).message}
        </Typography>
      )}

      {list.data && list.data.length === 0 && (
        <div className="entries-list__empty">
          <Typography variant="body">{t('admin:entries.empty')}</Typography>
        </div>
      )}

      {orderedEntries.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <table className="entries-list__table">
            <thead>
              <tr>
                <th className="entries-list__drag-header" />
                {columns.map((c) => (
                  <th key={c.id}>{c.label}</th>
                ))}
                <th>{t('admin:entries.statusColumn')}</th>
                <th />
              </tr>
            </thead>
            <SortableContext items={orderedIds} strategy={verticalListSortingStrategy}>
              <tbody>
                {orderedEntries.map((entry) => (
                  <SortableRow
                    key={entry.id}
                    entry={entry}
                    columns={columns}
                    lang={lang}
                    onOpen={openEntry}
                    onPublish={(id) => publish.mutate(id)}
                    onDelete={handleDelete}
                    isPublishing={publish.isPending}
                    isDeleting={del.isPending}
                  />
                ))}
              </tbody>
            </SortableContext>
          </table>

          <DragOverlay>
            {activeEntry && (
              <table className="entries-list__table entries-list__table--overlay">
                <tbody>
                  <SortableRow
                    entry={activeEntry}
                    columns={columns}
                    lang={lang}
                    onOpen={() => {}}
                    onPublish={() => {}}
                    onDelete={() => {}}
                    isPublishing={false}
                    isDeleting={false}
                    isDragOverlay
                  />
                </tbody>
              </table>
            )}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  );
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function truncate(value: string, max = 80): string {
  return value.length > max ? `${value.slice(0, max)}…` : value;
}

function renderCell(field: FieldDef, raw: unknown, lang: SupportedLanguage): ReactNode {
  if (field.type === 'checkbox' || field.type === 'switch') {
    return raw ? '✓' : '—';
  }

  let value: unknown = raw;
  if (field.multilingual && value && typeof value === 'object') {
    const ml = value as Multilingual<string>;
    value = ml[lang] || ml.hy || ml.ru || ml.en || '';
  }

  if (field.type === 'image') {
    return value ? (
      <img className="entries-list__thumb" src={String(value)} alt="" />
    ) : (
      '—'
    );
  }
  if (field.type === 'richtext') {
    const text = stripHtml(String(value ?? ''));
    return text ? truncate(text) : '—';
  }

  const text = String(value ?? '');
  return text ? truncate(text) : '—';
}
