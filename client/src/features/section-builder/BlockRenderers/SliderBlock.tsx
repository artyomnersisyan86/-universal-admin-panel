import { useTranslation } from 'react-i18next';
import { Typography } from '@shared/ui/Typography';
import './SliderBlock.css';

export function SliderBlockView() {
  const { t } = useTranslation('admin');
  return (
    <div className="sb-slider">
      <Typography variant="caption">{t('sectionBuilder.slider.preview')}</Typography>
      <Typography variant="caption" className="sb-slider__hint">
        {t('sectionBuilder.slider.stageHint')}
      </Typography>
    </div>
  );
}
