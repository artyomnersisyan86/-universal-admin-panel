import { useTranslation } from 'react-i18next';
import { Typography } from '@shared/ui/Typography';

export function SettingsPage() {
  const { t } = useTranslation('admin');
  return (
    <div>
      <Typography variant="h2">{t('nav.settings')}</Typography>
      <Typography variant="body">Coming soon.</Typography>
    </div>
  );
}
