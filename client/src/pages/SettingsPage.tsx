import { NavLink, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Typography } from '@shared/ui/Typography';
import { useAuth } from '@features/auth/useAuth';
import './SettingsPage.css';

interface SettingsTab {
  to: string;
  i18nKey: string;
  superadminOnly?: boolean;
}

const TABS: SettingsTab[] = [
  { to: 'sections', i18nKey: 'nav.sections', superadminOnly: true },
  { to: 'form-builder', i18nKey: 'nav.formBuilder' },
  { to: 'tables', i18nKey: 'nav.tables' },
  { to: 'api-builder', i18nKey: 'nav.apiBuilder', superadminOnly: true },
];

/**
 * Settings hub. The form/table/api builders and section management live here
 * as utilities; dynamic content sections are reached from the sidebar instead.
 * Renders the active tab through <Outlet>.
 */
export function SettingsPage() {
  const { t } = useTranslation('admin');
  const { user } = useAuth();

  const tabs = TABS.filter((tab) => !tab.superadminOnly || user?.role === 'superadmin');

  return (
    <div className="settings-page">
      <Typography variant="h2">{t('nav.settings')}</Typography>
      <nav className="settings-page__tabs">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              `settings-page__tab${isActive ? ' settings-page__tab--active' : ''}`
            }
          >
            {t(tab.i18nKey)}
          </NavLink>
        ))}
      </nav>
      <div className="settings-page__content">
        <Outlet />
      </div>
    </div>
  );
}
