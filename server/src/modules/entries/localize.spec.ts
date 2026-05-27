import { isLocale, localize, SUPPORTED_LOCALES } from './localize';

describe('localize', () => {
  it('detects supported locale codes', () => {
    expect(isLocale('hy')).toBe(true);
    expect(isLocale('ru')).toBe(true);
    expect(isLocale('en')).toBe(true);
    expect(isLocale('de')).toBe(false);
    expect(isLocale('')).toBe(false);
    expect(isLocale(123)).toBe(false);
  });

  it('returns scalars untouched', () => {
    expect(localize('plain', 'hy')).toBe('plain');
    expect(localize(42, 'hy')).toBe(42);
    expect(localize(null, 'hy')).toBe(null);
    expect(localize(undefined, 'hy')).toBe(undefined);
    expect(localize(true, 'hy')).toBe(true);
  });

  it('replaces a multilingual node with the requested locale value', () => {
    const data = { hy: 'Բարև', ru: 'Привет', en: 'Hello' };
    expect(localize(data, 'hy')).toBe('Բարև');
    expect(localize(data, 'ru')).toBe('Привет');
    expect(localize(data, 'en')).toBe('Hello');
  });

  it('walks into nested objects and replaces multilingual children', () => {
    const data = {
      title: { hy: 'Վերնագիր', ru: 'Заголовок', en: 'Title' },
      meta: {
        author: 'Anna',
        description: { hy: 'Նկ', ru: 'Опис', en: 'Desc' },
      },
    };
    expect(localize(data, 'ru')).toEqual({
      title: 'Заголовок',
      meta: { author: 'Anna', description: 'Опис' },
    });
  });

  it('walks arrays', () => {
    const data = [
      { hy: 'a', ru: 'б', en: 'c' },
      { hy: 'd', ru: 'е', en: 'f' },
    ];
    expect(localize(data, 'en')).toEqual(['c', 'f']);
  });

  it('does not treat a partial-key object as multilingual', () => {
    const data = { hy: 'A', random: 'B' };
    expect(localize(data, 'hy')).toEqual({ hy: 'A', random: 'B' });
  });

  it('does not treat a single-locale-key object as multilingual', () => {
    const data = { hy: 'A' };
    expect(localize(data, 'hy')).toEqual({ hy: 'A' });
    expect(localize(data, 'ru')).toEqual({ hy: 'A' });
  });

  it('does not treat a two-locale-key object as multilingual', () => {
    const data = { hy: 'A', ru: 'B' };
    expect(localize(data, 'en')).toEqual({ hy: 'A', ru: 'B' });
  });

  it('preserves non-multilingual scalar fields', () => {
    const data = {
      id: 'uuid',
      count: 7,
      title: { hy: 'A', ru: 'B', en: 'C' },
    };
    expect(localize(data, 'en')).toEqual({ id: 'uuid', count: 7, title: 'C' });
  });

  it('handles deep nesting with multilingual slider slides', () => {
    const data = {
      blocks: [
        {
          type: 'slider',
          slides: [
            {
              title: { hy: 'A', ru: 'B', en: 'C' },
              button: {
                label: { hy: 'click hy', ru: 'click ru', en: 'click en' },
                url: '/x',
              },
            },
          ],
        },
      ],
    };
    expect(localize(data, 'ru')).toEqual({
      blocks: [
        {
          type: 'slider',
          slides: [{ title: 'B', button: { label: 'click ru', url: '/x' } }],
        },
      ],
    });
  });

  it('lists exactly the three supported locales', () => {
    expect([...SUPPORTED_LOCALES].sort()).toEqual(['en', 'hy', 'ru']);
  });
});
