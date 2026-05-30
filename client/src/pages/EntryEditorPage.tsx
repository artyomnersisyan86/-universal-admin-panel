import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Typography } from '@shared/ui/Typography';
import { Button } from '@shared/ui/Button';
import { EntryEditor, useEntry } from '@features/entries';
import { useSectionBySlug } from '@features/sections';

/** Handles both `/c/:slug/new` (create) and `/c/:slug/:entryId` (edit). */
export function EntryEditorPage() {
  const { slug, entryId } = useParams<{ slug: string; entryId?: string }>();
  const { t } = useTranslation(['admin', 'common']);

  const { isLoading: sectionLoading, error: sectionError, section } = useSectionBySlug(slug);
  const entryQuery = useEntry(slug, entryId);

  const back = (
    <Link to={`/c/${slug}`} className="entry-editor__back">
      <Button variant="text" size="small">
        ← {t('admin:entries.backToList')}
      </Button>
    </Link>
  );

  if (sectionLoading) return <Typography variant="body">{t('common:app.loading')}</Typography>;
  if (sectionError || !section) {
    return (
      <div>
        {back}
        <Typography variant="body">⚠ {t('admin:sections.notFound')}</Typography>
      </div>
    );
  }

  // Edit mode — wait for the entry to resolve.
  if (entryId) {
    if (entryQuery.isLoading) {
      return <Typography variant="body">{t('common:app.loading')}</Typography>;
    }
    if (entryQuery.error || !entryQuery.data) {
      return (
        <div>
          {back}
          <Typography variant="body">⚠ {t('admin:entries.notFound')}</Typography>
        </div>
      );
    }
    return (
      <div>
        {back}
        <EntryEditor key={entryQuery.data.id} section={section} entry={entryQuery.data} />
      </div>
    );
  }

  // Create mode.
  return (
    <div>
      {back}
      <EntryEditor key="new" section={section} />
    </div>
  );
}
