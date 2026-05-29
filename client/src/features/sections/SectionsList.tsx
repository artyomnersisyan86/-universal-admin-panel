import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Typography } from '@shared/ui/Typography';
import { Button } from '@shared/ui/Button';
import type { Section, SupportedLanguage } from '@shared/types';
import { CreateSectionDialog } from './CreateSectionDialog';
import { useDeleteSection, useSectionsList } from './useSections';
import './SectionsList.css';

export function SectionsList() {
  const { t, i18n } = useTranslation(['admin', 'common']);
  const navigate = useNavigate();
  const lang = (i18n.resolvedLanguage as SupportedLanguage) || 'hy';

  const list = useSectionsList();
  const del = useDeleteSection();
  const [creating, setCreating] = useState(false);

  function openSection(s: Section) {
    navigate(`/sections/${s.id}`);
  }

  async function handleDelete(s: Section) {
    if (!window.confirm(t('admin:sections.confirmDelete', { name: s.name[lang] || s.slug }))) {
      return;
    }
    await del.mutateAsync(s.id);
  }

  return (
    <div className="sections-list">
      <header className="sections-list__header">
        <Typography variant="h2">{t('admin:sections.title')}</Typography>
        {!creating && (
          <Button onClick={() => setCreating(true)}>{t('admin:sections.create')}</Button>
        )}
      </header>

      {creating && (
        <CreateSectionDialog
          onClose={() => setCreating(false)}
          onCreated={(id) => {
            setCreating(false);
            navigate(`/sections/${id}`);
          }}
        />
      )}

      {list.isLoading && (
        <Typography variant="caption">{t('common:app.loading')}</Typography>
      )}
      {list.error && (
        <Typography variant="caption">⚠ {(list.error as Error).message}</Typography>
      )}
      {list.data && list.data.length === 0 && !creating && (
        <div className="sections-list__empty">
          <Typography variant="body">{t('admin:sections.empty')}</Typography>
        </div>
      )}

      {list.data && list.data.length > 0 && (
        <table className="sections-list__table">
          <thead>
            <tr>
              <th>{t('admin:sections.slug')}</th>
              <th>{t('admin:sections.name')}</th>
              <th>{t('admin:sections.public')}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {list.data.map((s) => (
              <tr key={s.id} onClick={() => openSection(s)} className="sections-list__row">
                <td>
                  <code>{s.slug}</code>
                </td>
                <td>{s.name[lang] || s.name.en || s.slug}</td>
                <td>{s.isPublic ? '✓' : '—'}</td>
                <td onClick={(e) => e.stopPropagation()} className="sections-list__actions">
                  <Button
                    size="small"
                    variant="text"
                    onClick={() => openSection(s)}
                  >
                    {t('common:app.edit')}
                  </Button>
                  <Button
                    size="small"
                    variant="text"
                    onClick={() => handleDelete(s)}
                  >
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
