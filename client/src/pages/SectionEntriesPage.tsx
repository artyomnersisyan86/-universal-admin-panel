import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Typography } from '@shared/ui/Typography';
import { EntriesList } from '@features/entries';
import { useSectionBySlug } from '@features/sections';

export function SectionEntriesPage() {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useTranslation(['admin', 'common']);
  const { isLoading, error, section } = useSectionBySlug(slug);

  if (isLoading) return <Typography variant="body">{t('common:app.loading')}</Typography>;
  if (error || !section) {
    return <Typography variant="body">⚠ {t('admin:sections.notFound')}</Typography>;
  }
  return <EntriesList section={section} />;
}
