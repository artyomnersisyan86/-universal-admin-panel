import { useMemo, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Typography } from '@shared/ui/Typography';
import { Button } from '@shared/ui/Button';
import type { FieldDef, Multilingual, Section, SupportedLanguage } from '@shared/types';
import type { Entry } from '@shared/api/entries';
import { useDeleteEntry, useEntriesList, usePublishEntry } from './useEntries';
import { collectFieldDefs } from './entryData';
import './EntriesList.css';

const MAX_COLUMNS = 4;

interface Props {
  section: Section;
}

/**
 * Per-section records table. Columns are derived from the layout's field
 * blocks; each row links into the {@link EntryEditor} (the same page-builder,
 * filled with the entry's data). Admins create/publish/delete here.
 */
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

      {list.data && list.data.length > 0 && (
        <table className="entries-list__table">
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.id}>{c.label}</th>
              ))}
              <th>{t('admin:entries.statusColumn')}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {list.data.map((entry) => (
              <tr
                key={entry.id}
                className="entries-list__row"
                onClick={() => openEntry(entry.id)}
              >
                {columns.map((c) => (
                  <td key={c.id}>{renderCell(c, entry.data[c.name], lang)}</td>
                ))}
                <td>
                  <span
                    className={`entries-list__status entries-list__status--${entry.status}`}
                  >
                    {t(`admin:entries.status.${entry.status}`)}
                  </span>
                </td>
                <td
                  className="entries-list__actions"
                  onClick={(ev) => ev.stopPropagation()}
                >
                  <Button size="small" variant="text" onClick={() => openEntry(entry.id)}>
                    {t('common:app.edit')}
                  </Button>
                  {entry.status === 'draft' && (
                    <Button
                      size="small"
                      variant="text"
                      onClick={() => publish.mutate(entry.id)}
                    >
                      {t('admin:entries.publish')}
                    </Button>
                  )}
                  <Button size="small" variant="text" onClick={() => handleDelete(entry)}>
                    {t('common:app.delete')}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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

/** Render a single data cell according to its field type. */
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
