import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Typography } from '@shared/ui/Typography';
import { Button } from '@shared/ui/Button';
import { SectionBuilder } from '@features/section-builder';
import { useSection } from '@features/sections/useSections';

export function SectionBuilderPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation(['admin', 'common']);
  const query = useSection(id);

  if (!id) return null;

  if (query.isLoading) {
    return <Typography variant="body">{t('common:app.loading')}</Typography>;
  }
  if (query.error || !query.data) {
    return (
      <div>
        <Typography variant="body">⚠ {t('admin:sections.notFound')}</Typography>
        <Link to="/settings/sections">
          <Button variant="text">{t('admin:sections.backToList')}</Button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link to="/settings/sections" className="section-builder__back">
        <Button variant="text" size="small">
          ← {t('admin:sections.backToList')}
        </Button>
      </Link>
      <SectionBuilder section={query.data} />
    </div>
  );
}
