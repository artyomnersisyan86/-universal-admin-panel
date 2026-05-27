import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

import commonHy from './locales/hy/common.json';
import commonRu from './locales/ru/common.json';
import commonEn from './locales/en/common.json';
import adminHy from './locales/hy/admin.json';
import adminRu from './locales/ru/admin.json';
import adminEn from './locales/en/admin.json';
import errorsHy from './locales/hy/errors.json';
import errorsRu from './locales/ru/errors.json';
import errorsEn from './locales/en/errors.json';

export const SUPPORTED_LANGUAGES = ['hy', 'ru', 'en'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

const DEFAULT_LANG: SupportedLanguage =
  (import.meta.env.VITE_DEFAULT_LANG as SupportedLanguage) || 'hy';

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: DEFAULT_LANG,
    supportedLngs: SUPPORTED_LANGUAGES,
    defaultNS: 'common',
    ns: ['common', 'admin', 'errors'],
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'uap.lang',
      caches: ['localStorage'],
    },
    resources: {
      hy: { common: commonHy, admin: adminHy, errors: errorsHy },
      ru: { common: commonRu, admin: adminRu, errors: errorsRu },
      en: { common: commonEn, admin: adminEn, errors: errorsEn },
    },
  });

export default i18n;
