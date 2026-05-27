/**
 * Locale codes supported across the admin panel. Default UI language is `hy`.
 */
export type Locale = 'hy' | 'ru' | 'en';

export const SUPPORTED_LOCALES: ReadonlySet<Locale> = new Set(['hy', 'ru', 'en']);

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && SUPPORTED_LOCALES.has(value as Locale);
}

/**
 * A multilingual value is a plain object whose keys are EXACTLY the supported
 * locales (`{ hy, ru, en }`). We detect structurally — the layout doesn't need
 * to flag multilingual fields. Partial-key objects (`{ hy }`, `{ hy, random }`)
 * are left alone so we don't silently drop data or return `undefined`.
 */
function isMultilingualValue(value: unknown): value is Record<Locale, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const keys = Object.keys(value as object);
  if (keys.length !== SUPPORTED_LOCALES.size) return false;
  return keys.every((k) => SUPPORTED_LOCALES.has(k as Locale));
}

/**
 * Walks the data tree and replaces every detected multilingual node
 * `{ hy, ru, en }` with just the value for the requested locale.
 *
 * Non-multilingual fields pass through untouched.
 */
export function localize<T>(data: T, lang: Locale): T {
  if (data === null || data === undefined) return data;
  if (Array.isArray(data)) {
    return data.map((item) => localize(item, lang)) as unknown as T;
  }
  if (typeof data === 'object') {
    if (isMultilingualValue(data)) {
      return data[lang] as unknown as T;
    }
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      result[key] = localize(value, lang);
    }
    return result as unknown as T;
  }
  return data;
}
