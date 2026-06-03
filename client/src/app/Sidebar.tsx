import { useState } from 'react';
import { createPortal } from 'react-dom';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSectionsList, CreateSectionDialog } from '@features/sections';
import { useAuth } from '@features/auth/useAuth';
import type { SupportedLanguage } from '@shared/types';
import './Sidebar.css';

export function Sidebar() {
  const { t, i18n } = useTranslation('admin');
  const lang = (i18n.resolvedLanguage as SupportedLanguage) || 'hy';
  const sections = useSectionsList();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);

  const ordered = [...(sections.data ?? [])].sort(
    (a, b) => a.displayOrder - b.displayOrder,
  );

  const isSuperadmin = user?.role === 'superadmin';
  const showGroup = ordered.length > 0 || isSuperadmin;

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `sidebar__link${isActive ? ' sidebar__link--active' : ''}`;

  return (
    <aside className="sidebar">
      <nav className="sidebar__nav">
        <NavLink to="/dashboard" className={linkClass}>
          {t('nav.dashboard')}
        </NavLink>

        {showGroup && (
          <div className="sidebar__group">
            <div className="sidebar__group-header">
              <span className="sidebar__group-label">{t('nav.sections')}</span>
              {isSuperadmin && (
                <button
                  className="sidebar__add-btn"
                  onClick={() => setCreating(true)}
                  title={t('sections.create')}
                  aria-label={t('sections.create')}
                >
                  +
                </button>
              )}
            </div>
            {isSuperadmin && ordered.length === 0 && (
              <span className="sidebar__empty-hint">{t('sections.noSectionsHint')}</span>
            )}
            {ordered.map((s) => (
              <NavLink key={s.id} to={`/c/${s.slug}`} className={linkClass}>
                {s.icon && <span className="sidebar__icon">{s.icon}</span>}
                {s.name[lang] || s.name.en || s.slug}
              </NavLink>
            ))}
          </div>
        )}

        <NavLink to="/settings" className={linkClass}>
          {t('nav.settings')}
        </NavLink>
      </nav>

      {creating &&
        createPortal(
          <div
            className="sidebar-modal-backdrop"
            onClick={() => setCreating(false)}
          >
            <div
              className="sidebar-modal-content"
              onClick={(e) => e.stopPropagation()}
            >
              <CreateSectionDialog
                onClose={() => setCreating(false)}
                onCreated={(id) => {
                  setCreating(false);
                  navigate(`/settings/sections/${id}`);
                }}
              />
            </div>
          </div>,
          document.body,
        )}
    </aside>
  );
}
