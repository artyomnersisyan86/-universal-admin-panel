import { useTranslation } from 'react-i18next';
import { useBreakpoint } from './useBreakpoint';
import type { Breakpoint } from '@shared/types';
import './PreviewToggle.css';

export function PreviewToggle() {
  const { t } = useTranslation('admin');
  const { breakpoint, setBreakpoint } = useBreakpoint();

  const options: { value: Breakpoint; label: string; icon: string }[] = [
    { value: 'desktop', label: t('sectionBuilder.preview.desktop'), icon: '🖥️' },
    { value: 'tablet', label: t('sectionBuilder.preview.tablet'), icon: '📱' },
    { value: 'mobile', label: t('sectionBuilder.preview.mobile'), icon: '📲' },
  ];

  return (
    <div className="sb-preview-toggle">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={[
            'sb-preview-toggle__btn',
            breakpoint === opt.value && 'sb-preview-toggle__btn--active',
          ]
            .filter(Boolean)
            .join(' ')}
          onClick={() => setBreakpoint(opt.value)}
          title={opt.label}
        >
          <span className="sb-preview-toggle__icon">{opt.icon}</span>
          <span className="sb-preview-toggle__label">{opt.label}</span>
        </button>
      ))}
    </div>
  );
}
