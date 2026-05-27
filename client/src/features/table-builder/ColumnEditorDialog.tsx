import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Typography } from '@shared/ui/Typography';
import { Button } from '@shared/ui/Button';
import { TextInput } from '@shared/ui/TextInput';
import { Select } from '@shared/ui/Select';
import { FieldShell } from '@shared/ui/_FieldShell';
import type { TableColumnDef, TableColumnType } from '@shared/types';
import './ColumnEditorDialog.css';

export interface ColumnEditorDialogProps {
  tableName: string;
  columns: TableColumnDef[];
  onSave: (next: { name: string; columns: TableColumnDef[] }) => Promise<void> | void;
  onClose: () => void;
}

const TYPES: TableColumnType[] = ['text', 'number', 'boolean', 'image', 'richtext'];

export function ColumnEditorDialog({
  tableName: initialName,
  columns: initialColumns,
  onSave,
  onClose,
}: ColumnEditorDialogProps) {
  const { t } = useTranslation('admin');
  const [name, setName] = useState(initialName);
  const [cols, setCols] = useState<TableColumnDef[]>(initialColumns);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update(i: number, patch: Partial<TableColumnDef>) {
    setCols((prev) => prev.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  }

  function remove(i: number) {
    setCols((prev) => prev.filter((_, idx) => idx !== i));
  }

  function move(i: number, dir: -1 | 1) {
    setCols((prev) => {
      const next = [...prev];
      const j = i + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  function add() {
    const base = 'column';
    let n = cols.length + 1;
    while (cols.some((c) => c.key === `${base}${n}`)) n++;
    setCols((prev) => [
      ...prev,
      { key: `${base}${n}`, label: `Column ${n}`, type: 'text' },
    ]);
  }

  async function handleSave() {
    setError(null);
    if (!name.trim()) {
      setError(t('columnEditor.errorEmptyName'));
      return;
    }
    const keys = new Set<string>();
    for (const c of cols) {
      if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(c.key)) {
        setError(t('columnEditor.errorBadKey', { key: c.key }));
        return;
      }
      if (keys.has(c.key)) {
        setError(t('columnEditor.errorDupKey', { key: c.key }));
        return;
      }
      keys.add(c.key);
      if (!c.label.trim()) {
        setError(t('columnEditor.errorEmptyLabel', { key: c.key }));
        return;
      }
    }
    setBusy(true);
    try {
      await onSave({ name: name.trim(), columns: cols });
      onClose();
    } catch (e) {
      setError(
        (e as { response?: { data?: { message?: string } } }).response?.data?.message ??
          t('columnEditor.errorSave'),
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="column-editor__backdrop" onClick={onClose}>
      <div className="column-editor" onClick={(e) => e.stopPropagation()}>
        <header className="column-editor__header">
          <Typography variant="h3">{t('columnEditor.title')}</Typography>
          <Button variant="text" size="small" onClick={onClose}>
            ✕
          </Button>
        </header>

        <div className="column-editor__body">
          <p
            className="column-editor__intro"
            dangerouslySetInnerHTML={{ __html: t('columnEditor.intro') }}
          />

          <FieldShell label={t('columnEditor.tableName')}>
            <TextInput value={name} onChange={(e) => setName(e.target.value)} />
          </FieldShell>

          <div className="column-editor__cols">
            {cols.length === 0 && (
              <p className="column-editor__empty">{t('columnEditor.noColumns')}</p>
            )}
            {cols.map((c, i) => (
              <div key={i} className="column-editor__col">
                <div className="column-editor__col-row">
                  <FieldShell label={t('columnEditor.key')}>
                    <TextInput
                      value={c.key}
                      onChange={(e) => update(i, { key: e.target.value })}
                      placeholder={t('columnEditor.keyPlaceholder')}
                    />
                  </FieldShell>
                  <FieldShell label={t('columnEditor.label')}>
                    <TextInput
                      value={c.label}
                      onChange={(e) => update(i, { label: e.target.value })}
                      placeholder={t('columnEditor.labelPlaceholder')}
                    />
                  </FieldShell>
                  <FieldShell label={t('columnEditor.type')}>
                    <Select
                      options={TYPES.map((tp) => ({ value: tp, label: t(`columnEditor.types.${tp}`) }))}
                      value={c.type}
                      onChange={(e) => update(i, { type: e.target.value as TableColumnType })}
                    />
                  </FieldShell>
                </div>
                <div className="column-editor__col-flags">
                  <label title={t('columnEditor.multilingualHint')}>
                    <input
                      type="checkbox"
                      checked={!!c.multilingual}
                      onChange={(e) => update(i, { multilingual: e.target.checked })}
                    />
                    <span>{t('columnEditor.multilingual')}</span>
                    <span className="column-editor__flag-hint">
                      {t('columnEditor.multilingualHint')}
                    </span>
                  </label>
                  <label title={t('columnEditor.searchableHint')}>
                    <input
                      type="checkbox"
                      checked={!!c.searchable}
                      onChange={(e) => update(i, { searchable: e.target.checked })}
                    />
                    <span>{t('columnEditor.searchable')}</span>
                    <span className="column-editor__flag-hint">
                      {t('columnEditor.searchableHint')}
                    </span>
                  </label>
                  <label title={t('columnEditor.hiddenHint')}>
                    <input
                      type="checkbox"
                      checked={!!c.hidden}
                      onChange={(e) => update(i, { hidden: e.target.checked })}
                    />
                    <span>{t('columnEditor.hidden')}</span>
                    <span className="column-editor__flag-hint">
                      {t('columnEditor.hiddenHint')}
                    </span>
                  </label>
                  <div className="column-editor__col-actions">
                    <Button size="small" variant="text" onClick={() => move(i, -1)} disabled={i === 0}>
                      ↑
                    </Button>
                    <Button
                      size="small"
                      variant="text"
                      onClick={() => move(i, 1)}
                      disabled={i === cols.length - 1}
                    >
                      ↓
                    </Button>
                    <Button size="small" variant="text" onClick={() => remove(i)}>
                      🗑
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Button variant="outlined" onClick={add}>
            + {t('columnEditor.addColumn')}
          </Button>

          {error && <p className="column-editor__error">{error}</p>}
        </div>

        <footer className="column-editor__footer">
          <Button variant="text" onClick={onClose}>
            {t('columnEditor.cancel')}
          </Button>
          <Button onClick={handleSave} loading={busy}>
            {t('columnEditor.save')}
          </Button>
        </footer>
      </div>
    </div>
  );
}
