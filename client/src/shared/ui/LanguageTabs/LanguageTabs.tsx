import { useState, type ReactNode } from 'react';
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '@shared/types';
import './LanguageTabs.css';

export interface LanguageTabsProps {
  /** Renders one input panel per language; receives the active language. */
  render: (lang: SupportedLanguage) => ReactNode;
  /** Show indicators (dot) for languages that already have content. */
  hasContent?: (lang: SupportedLanguage) => boolean;
  /** Show indicators (red) for languages with validation errors. */
  hasError?: (lang: SupportedLanguage) => boolean;
  initialLang?: SupportedLanguage;
  className?: string;
}

/**
 * LanguageTabs — wraps a multilingual form input.
 * Shows hy | ru | en tabs above the active panel.
 * For required-multilingual fields all three tabs must be filled (validation happens upstream).
 */
export function LanguageTabs({
  render,
  hasContent,
  hasError,
  initialLang = 'hy',
  className = '',
}: LanguageTabsProps) {
  const [active, setActive] = useState<SupportedLanguage>(initialLang);

  return (
    <div className={`lang-tabs${className ? ` ${className}` : ''}`}>
      <div role="tablist" className="lang-tabs__list">
        {SUPPORTED_LANGUAGES.map((lang) => {
          const isActive = active === lang;
          const filled = hasContent?.(lang) ?? false;
          const erred = hasError?.(lang) ?? false;
          return (
            <button
              key={lang}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={[
                'lang-tabs__tab',
                isActive && 'lang-tabs__tab--active',
                erred && 'lang-tabs__tab--error',
                filled && !erred && 'lang-tabs__tab--filled',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => setActive(lang)}
            >
              {lang.toUpperCase()}
            </button>
          );
        })}
      </div>
      <div role="tabpanel" className="lang-tabs__panel">
        {render(active)}
      </div>
    </div>
  );
}
