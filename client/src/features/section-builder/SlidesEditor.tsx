import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, TextInput, LanguageTabs, ImageUpload, Typography } from '@shared/ui';
import { FieldShell } from '@shared/ui/_FieldShell';
import type { Multilingual, Slide } from '@shared/types';
import { makeSlide, toMultilingual, toPlainText } from './blockTree';
import { uploadFile } from '@shared/api/uploads';
import './propertyPanels/SliderProps.css';

interface Props {
  slides: Slide[];
  onChange: (slides: Slide[]) => void;
}

/**
 * Reusable slide list editor — add/remove/reorder slides and edit the active
 * one (title / text / button / images, each with a multilingual toggle).
 *
 * Used both by the builder property panel (`SliderProps`, where slides live in
 * `block.props.slides`) and by the entry editor (where slides are per-entry
 * content keyed by the slider block id).
 */
export function SlidesEditor({ slides, onChange }: Props) {
  const { t } = useTranslation('admin');
  const [activeSlideId, setActiveSlideId] = useState<string | null>(null);

  const activeSlide = slides.find((s) => s.id === activeSlideId);

  function handleAddSlide() {
    const newSlide = makeSlide();
    onChange([...slides, newSlide]);
    setActiveSlideId(newSlide.id);
  }

  function handleRemoveSlide(id: string) {
    onChange(slides.filter((s) => s.id !== id));
    if (activeSlideId === id) setActiveSlideId(null);
  }

  function handleMoveSlide(index: number, direction: 'up' | 'down') {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= slides.length) return;
    const next = [...slides];
    [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
    onChange(next);
  }

  function updateActiveSlide(patch: Partial<Slide>) {
    if (!activeSlideId) return;
    onChange(slides.map((s) => (s.id === activeSlideId ? { ...s, ...patch } : s)));
  }

  return (
    <div className="sb-slider-props">
      <div className="sb-slider-props__list-header">
        <Typography variant="caption" className="sb-slider-props__count">
          {t('sectionBuilder.block.slider')} ({slides.length})
        </Typography>
        <Button size="small" onClick={handleAddSlide}>
          + {t('sectionBuilder.slider.addSlide')}
        </Button>
      </div>

      {slides.length === 0 ? (
        <Typography variant="caption" className="sb-slider-props__empty">
          {t('sectionBuilder.slider.noSlides')}
        </Typography>
      ) : (
        <div className="sb-slider-props__list">
          {slides.map((s, index) => (
            <div
              key={s.id}
              className={[
                'sb-slider-props__item',
                activeSlideId === s.id && 'sb-slider-props__item--active',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => setActiveSlideId(s.id)}
            >
              {s.image.desktop ? (
                <img src={s.image.desktop} alt="" className="sb-slider-props__thumb" />
              ) : (
                <div className="sb-slider-props__thumb sb-slider-props__thumb--empty">🖼</div>
              )}
              <span className="sb-slider-props__item-title">
                {toPlainText(s.title ?? '') || `${t('sectionBuilder.block.slider')} #${index + 1}`}
              </span>
              <div
                className="sb-slider-props__item-actions"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => handleMoveSlide(index, 'up')}
                  className="sb-slider-props__btn"
                  aria-label="Move up"
                >
                  ▲
                </button>
                <button
                  type="button"
                  disabled={index === slides.length - 1}
                  onClick={() => handleMoveSlide(index, 'down')}
                  className="sb-slider-props__btn"
                  aria-label="Move down"
                >
                  ▼
                </button>
                <button
                  type="button"
                  onClick={() => handleRemoveSlide(s.id)}
                  className="sb-slider-props__btn sb-slider-props__btn--remove"
                  aria-label="Remove slide"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeSlide && (
        <div className="sb-slider-props__editor">
          <Typography variant="caption" className="sb-slider-props__editor-title">
            {t('sectionBuilder.slider.activeSlideSettings', {
              index: slides.indexOf(activeSlide) + 1,
            })}
          </Typography>

          <MultilingualField
            label={t('sectionBuilder.slider.slideTitle')}
            multilingual={Boolean(activeSlide.multilingualTitle)}
            value={activeSlide.title}
            onToggle={(next, value) => updateActiveSlide({ multilingualTitle: next, title: value })}
            onChange={(title) => updateActiveSlide({ title })}
          />

          <MultilingualField
            label={t('sectionBuilder.slider.slideText')}
            multilingual={Boolean(activeSlide.multilingualText)}
            value={activeSlide.text}
            onToggle={(next, value) => updateActiveSlide({ multilingualText: next, text: value })}
            onChange={(text) => updateActiveSlide({ text })}
          />

          <MultilingualField
            label={t('sectionBuilder.slider.buttonLabel')}
            multilingual={Boolean(activeSlide.multilingualButton)}
            value={activeSlide.buttonLabel}
            onToggle={(next, value) =>
              updateActiveSlide({ multilingualButton: next, buttonLabel: value })
            }
            onChange={(buttonLabel) => updateActiveSlide({ buttonLabel })}
          />

          <FieldShell label={t('sectionBuilder.slider.buttonUrl')}>
            <TextInput
              value={activeSlide.buttonUrl ?? ''}
              placeholder="https://example.com"
              onChange={(e) => updateActiveSlide({ buttonUrl: e.target.value })}
            />
          </FieldShell>

          <div className="sb-slider-props__images">
            <FieldShell label={t('sectionBuilder.slider.imageDesktop')}>
              <ImageUpload
                value={activeSlide.image.desktop || undefined}
                onChange={(url) =>
                  updateActiveSlide({ image: { ...activeSlide.image, desktop: url ?? '' } })
                }
                uploadFn={uploadFile}
              />
            </FieldShell>
            <FieldShell label={t('sectionBuilder.slider.imageMobile')}>
              <ImageUpload
                value={activeSlide.image.mobile}
                onChange={(url) =>
                  updateActiveSlide({ image: { ...activeSlide.image, mobile: url } })
                }
                uploadFn={uploadFile}
              />
            </FieldShell>
          </div>
        </div>
      )}
    </div>
  );
}

interface MultilingualFieldProps {
  label: string;
  multilingual: boolean;
  value: Slide['title'];
  onToggle: (next: boolean, value: string | Multilingual<string>) => void;
  onChange: (value: string | Multilingual<string>) => void;
}

/** A text field with a multilingual toggle, shared by title/text/button label. */
function MultilingualField({ label, multilingual, value, onToggle, onChange }: MultilingualFieldProps) {
  const { t } = useTranslation('admin');
  return (
    <div className="sb-slider-props__group">
      <label className="property-panel__check">
        <input
          type="checkbox"
          checked={multilingual}
          onChange={(e) => {
            const next = e.target.checked;
            onToggle(next, next ? toMultilingual(value ?? '') : toPlainText(value ?? ''));
          }}
        />
        <span>{t('sectionBuilder.props.multilingual')}</span>
      </label>
      <FieldShell label={label}>
        {multilingual ? (
          <LanguageTabs
            hasContent={(lang) => Boolean((value as Multilingual<string>)?.[lang]?.trim())}
            render={(lang) => (
              <TextInput
                value={(value as Multilingual<string>)?.[lang] ?? ''}
                onChange={(e) => {
                  const current = (value as Multilingual<string>) ?? toMultilingual('');
                  onChange({ ...current, [lang]: e.target.value });
                }}
              />
            )}
          />
        ) : (
          <TextInput
            value={typeof value === 'string' ? value : ''}
            onChange={(e) => onChange(e.target.value)}
          />
        )}
      </FieldShell>
    </div>
  );
}
