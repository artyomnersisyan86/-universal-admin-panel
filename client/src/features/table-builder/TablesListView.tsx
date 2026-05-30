import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Typography } from '@shared/ui/Typography';
import { Button } from '@shared/ui/Button';
import { TextInput } from '@shared/ui/TextInput';
import { FieldShell } from '@shared/ui/_FieldShell';
import { tablesApi } from '@shared/api/tables';
import type { TableDefinition } from '@shared/types';
import './TablesListView.css';

export function TablesListView() {
  const { t } = useTranslation(['admin', 'common']);
  const navigate = useNavigate();
  const [tables, setTables] = useState<TableDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    setLoading(true);
    try {
      setTables(await tablesApi.list());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const created = await tablesApi.create({
        name: newName.trim(),
        columns: [
          { key: 'title', label: 'Title', type: 'text', multilingual: true, searchable: true },
          { key: 'published', label: 'Published', type: 'boolean' },
        ],
      });
      setNewName('');
      setCreating(false);
      navigate(`/settings/tables/${created.id}`);
    } catch (err) {
      setError(
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ??
          t('admin:tables.errorCreate'),
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm(t('admin:tables.confirmDeleteTable'))) return;
    await tablesApi.remove(id);
    void reload();
  }

  const isEmpty = !loading && tables.length === 0;

  return (
    <div className="tables-list">
      <header className="tables-list__header">
        <div>
          <Typography variant="h2">{t('admin:nav.tables')}</Typography>
          <p className="tables-list__intro">{t('admin:tables.intro')}</p>
        </div>
        {!isEmpty && (
          <Button onClick={() => setCreating((v) => !v)}>
            {creating ? t('common:app.cancel') : `+ ${t('admin:tables.newTable')}`}
          </Button>
        )}
      </header>

      {creating && (
        <form className="tables-list__create" onSubmit={handleCreate}>
          <FieldShell label={t('admin:tables.tableName')}>
            <TextInput
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={t('admin:tables.tableNamePlaceholder')}
              required
              autoFocus
            />
          </FieldShell>
          <div className="tables-list__create-hint">{t('admin:tables.createHint')}</div>
          {error && <p className="tables-list__error">{error}</p>}
          <Button type="submit" loading={busy}>
            {t('common:app.create')}
          </Button>
        </form>
      )}

      {loading ? (
        <p>{t('common:app.loading')}…</p>
      ) : isEmpty ? (
        <div className="tables-list__empty-state">
          <div className="tables-list__empty-icon" aria-hidden>
            📊
          </div>
          <Typography variant="h3">{t('admin:tables.emptyTitle')}</Typography>
          <p className="tables-list__empty-desc">{t('admin:tables.emptyDescription')}</p>
          <Button onClick={() => setCreating(true)}>
            + {t('admin:tables.emptyCta')}
          </Button>
        </div>
      ) : (
        <ul className="tables-list__items">
          {tables.map((tb) => (
            <li key={tb.id} className="tables-list__item">
              <button
                type="button"
                className="tables-list__item-open"
                onClick={() => navigate(`/settings/tables/${tb.id}`)}
              >
                <span className="tables-list__item-name">{tb.name}</span>
                <span className="tables-list__item-meta">
                  {t('admin:tables.itemMeta', {
                    count: tb.columns.length,
                    date: new Date(tb.updatedAt).toLocaleDateString(),
                  })}
                </span>
              </button>
              <Button variant="text" size="small" onClick={() => handleDelete(tb.id)}>
                🗑
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
