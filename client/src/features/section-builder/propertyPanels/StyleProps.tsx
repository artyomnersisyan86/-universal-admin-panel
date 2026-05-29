import { useTranslation } from 'react-i18next';
import { ColorPicker } from '@shared/ui/ColorPicker';
import { FieldShell } from '@shared/ui/_FieldShell';
import type { BlockStyle } from '@shared/types';
import { SpacingSelect, RadiusSelect, BorderWidthSelect } from './styleControls';

interface Props {
  style: BlockStyle | undefined;
  onChange: (next: BlockStyle) => void;
}

/**
 * Style section shared by every block type — colors, spacing and border.
 * Patches are merged into the block's `props.style` object.
 */
export function StyleProps({ style, onChange }: Props) {
  const { t } = useTranslation('admin');
  const s = style ?? {};
  const set = (patch: Partial<BlockStyle>) => onChange({ ...s, ...patch });

  return (
    <>
      <FieldShell label={t('sectionBuilder.style.background')}>
        <ColorPicker
          value={s.backgroundColor}
          onChange={(v) => set({ backgroundColor: v })}
          noneLabel={t('sectionBuilder.style.none')}
          customLabel={t('sectionBuilder.style.custom')}
        />
      </FieldShell>

      <FieldShell label={t('sectionBuilder.style.textColor')}>
        <ColorPicker
          value={s.textColor}
          onChange={(v) => set({ textColor: v })}
          noneLabel={t('sectionBuilder.style.none')}
          customLabel={t('sectionBuilder.style.custom')}
        />
      </FieldShell>

      <div className="property-panel__row">
        <FieldShell label={t('sectionBuilder.style.padding')}>
          <SpacingSelect value={s.padding} onChange={(v) => set({ padding: v })} />
        </FieldShell>
        <FieldShell label={t('sectionBuilder.style.margin')}>
          <SpacingSelect value={s.margin} onChange={(v) => set({ margin: v })} />
        </FieldShell>
      </div>

      <FieldShell label={t('sectionBuilder.style.borderColor')}>
        <ColorPicker
          value={s.borderColor}
          onChange={(v) => set({ borderColor: v })}
          noneLabel={t('sectionBuilder.style.none')}
          customLabel={t('sectionBuilder.style.custom')}
        />
      </FieldShell>

      <div className="property-panel__row">
        <FieldShell label={t('sectionBuilder.style.borderWidth')}>
          <BorderWidthSelect
            value={s.borderWidth}
            onChange={(v) => set({ borderWidth: v })}
          />
        </FieldShell>
        <FieldShell label={t('sectionBuilder.style.borderRadius')}>
          <RadiusSelect value={s.borderRadius} onChange={(v) => set({ borderRadius: v })} />
        </FieldShell>
      </div>
    </>
  );
}
