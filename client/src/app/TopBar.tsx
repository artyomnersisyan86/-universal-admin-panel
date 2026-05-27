import { useTranslation } from 'react-i18next';
import { useTheme } from '@shared/theme/useTheme';
import { Button } from '@shared/ui/Button';
import { Typography } from '@shared/ui/Typography';
import { useAuth } from '@features/auth/useAuth';
import './TopBar.css';

const LANGS = ['hy', 'ru', 'en'] as const;

export function TopBar() {
  const { theme, toggleTheme } = useTheme();
  const { i18n, t } = useTranslation('common');
  const { user, logout } = useAuth();

  return (
    <header className="topbar">
      <Typography variant="h5" className="topbar__brand">
        {t('app.title')}
      </Typography>

      <div className="topbar__actions">
        <select
          className="topbar__lang"
          value={i18n.language.slice(0, 2)}
          onChange={(e) => void i18n.changeLanguage(e.target.value)}
          aria-label={t('app.languageSwitcher')}
        >
          {LANGS.map((l) => (
            <option key={l} value={l}>
              {l.toUpperCase()}
            </option>
          ))}
        </select>

        <Button variant="text" size="small" onClick={toggleTheme}>
          {theme === 'dark' ? t('app.lightMode') : t('app.darkMode')}
        </Button>

        {user && (
          <>
            <Typography variant="caption" className="topbar__user">
              {user.email}
            </Typography>
            <Button variant="outlined" size="small" onClick={logout}>
              {t('app.logout')}
            </Button>
          </>
        )}
      </div>
    </header>
  );
}
