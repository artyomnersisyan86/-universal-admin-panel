import { useTranslation } from 'react-i18next';
import { Typography } from '@shared/ui/Typography';
import type { ContainerBlock } from '@shared/types';
import './ContainerBlock.css';

interface Props {
  block: ContainerBlock;
}

export function ContainerBlockView({ block }: Props) {
  const { t } = useTranslation('admin');
  return (
    <div className="sb-container">
      <Typography variant="caption">{t('sectionBuilder.container.preview')}</Typography>
      <Typography variant="caption" className="sb-container__hint">
        {t('sectionBuilder.container.stageHint')}
      </Typography>
      {block.children.length > 0 && (
        <Typography variant="caption">
          ({block.children.length} children — Stage 3)
        </Typography>
      )}
    </div>
  );
}
