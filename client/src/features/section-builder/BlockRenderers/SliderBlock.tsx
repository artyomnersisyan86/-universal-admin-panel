import { useTranslation } from 'react-i18next';
import { Typography } from '@shared/ui/Typography';
import type { SliderBlock } from '@shared/types';
import './SliderBlock.css';

interface Props {
  block: SliderBlock;
}

export function SliderBlockView({ block }: Props) {
  const { t } = useTranslation('admin');
  const count = block.props.slides.length;
  return (
    <div className="sb-slider">
      <Typography variant="caption">
        {t('sectionBuilder.slider.preview')} ({count})
      </Typography>
      <Typography variant="caption" className="sb-slider__hint">
        {t('sectionBuilder.slider.stageHint')}
      </Typography>
    </div>
  );
}
