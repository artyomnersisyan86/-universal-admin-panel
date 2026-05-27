import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@features/auth/useAuth';
import './Sidebar.css';

interface NavItem {
  to: string;
  i18nKey: string;
  superadminOnly?: boolean;
}

const ITEMS: NavItem[] = [
  { to: '/dashboard', i18nKey: 'nav.dashboard' },
  { to: '/form-builder', i18nKey: 'nav.formBuilder' },
  { to: '/tables', i18nKey: 'nav.tables' },
  { to: '/api-builder', i18nKey: 'nav.apiBuilder', superadminOnly: true },
  { to: '/settings', i18nKey: 'nav.settings' },
];

export function Sidebar() {
  const { t } = useTranslation('admin');
  const { user } = useAuth();

  return (
    <aside className="sidebar">
      <nav className="sidebar__nav">
        {ITEMS.filter((i) => !i.superadminOnly || user?.role === 'superadmin').map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `sidebar__link${isActive ? ' sidebar__link--active' : ''}`
            }
          >
            {t(item.i18nKey)}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
