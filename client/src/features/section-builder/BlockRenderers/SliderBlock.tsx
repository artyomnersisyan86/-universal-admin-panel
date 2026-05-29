import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Typography } from '@shared/ui/Typography';
import type { LocalizedText, SliderBlock, SupportedLanguage } from '@shared/types';
import './SliderBlock.css';

const AUTOPLAY_MS = 4000;

interface Props {
  block: SliderBlock;
}

function localized(value: LocalizedText | undefined, lang: SupportedLanguage): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value[lang] || value.hy || value.ru || value.en || '';
}

/** Live, auto-playing carousel preview rendered inside the builder canvas. */
export function SliderBlockView({ block }: Props) {
  const { t, i18n } = useTranslation('admin');
  const lang = (i18n.resolvedLanguage as SupportedLanguage) || 'hy';
  const slides = block.props.slides;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  // Keep the index in range as slides are added/removed.
  useEffect(() => {
    if (index >= slides.length && slides.length > 0) setIndex(0);
  }, [slides.length, index]);

  useEffect(() => {
    if (paused || slides.length <= 1) return;
    const id = window.setInterval(
      () => setIndex((i) => (i + 1) % slides.length),
      AUTOPLAY_MS,
    );
    return () => window.clearInterval(id);
  }, [paused, slides.length]);

  if (slides.length === 0) {
    return (
      <div className="sb-slider sb-slider--empty">
        <Typography variant="caption">{t('sectionBuilder.slider.noSlides')}</Typography>
      </div>
    );
  }

  const slide = slides[Math.min(index, slides.length - 1)];
  const title = localized(slide.title, lang);
  const text = localized(slide.text, lang);
  const label = localized(slide.buttonLabel, lang);
  const go = (next: number) => setIndex((next + slides.length) % slides.length);

  return (
    <div
      className="sb-slider-preview"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="sb-slider-preview__stage">
        {slide.image.desktop ? (
          <img className="sb-slider-preview__img" src={slide.image.desktop} alt="" />
        ) : (
          <div className="sb-slider-preview__img sb-slider-preview__img--empty">🖼</div>
        )}

        {(title || text || label) && (
          <div className="sb-slider-preview__overlay">
            {title && (
              <Typography variant="h4" className="sb-slider-preview__title">
                {title}
              </Typography>
            )}
            {text && (
              <Typography variant="body" className="sb-slider-preview__text">
                {text}
              </Typography>
            )}
            {label && <span className="sb-slider-preview__button">{label}</span>}
          </div>
        )}

        {slides.length > 1 && (
          <>
            <button
              type="button"
              className="sb-slider-preview__nav sb-slider-preview__nav--prev"
              onClick={(e) => {
                e.stopPropagation();
                go(index - 1);
              }}
              aria-label="Previous slide"
            >
              ‹
            </button>
            <button
              type="button"
              className="sb-slider-preview__nav sb-slider-preview__nav--next"
              onClick={(e) => {
                e.stopPropagation();
                go(index + 1);
              }}
              aria-label="Next slide"
            >
              ›
            </button>
          </>
        )}
      </div>

      {slides.length > 1 && (
        <div className="sb-slider-preview__dots">
          {slides.map((s, i) => (
            <button
              key={s.id}
              type="button"
              className={[
                'sb-slider-preview__dot',
                i === index && 'sb-slider-preview__dot--active',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={(e) => {
                e.stopPropagation();
                setIndex(i);
              }}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
