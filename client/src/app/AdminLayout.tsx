import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useMaxWidth } from '@shared/lib/useMediaQuery';
import { TopBar } from './TopBar';
import { Sidebar } from './Sidebar';
import './AdminLayout.css';

export function AdminLayout() {
  const [navOpen, setNavOpen] = useState(false);
  const isMobile = useMaxWidth('md');
  const location = useLocation();

  // Leaving mobile (or navigating) dismisses the drawer so it can't get
  // stuck open as an off-canvas panel on desktop.
  useEffect(() => {
    if (!isMobile) setNavOpen(false);
  }, [isMobile]);

  useEffect(() => {
    setNavOpen(false);
  }, [location.pathname]);

  // Esc closes the drawer.
  useEffect(() => {
    if (!navOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setNavOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navOpen]);

  return (
    <div className={`admin-layout${navOpen ? ' admin-layout--nav-open' : ''}`}>
      <TopBar navOpen={navOpen} onToggleNav={() => setNavOpen((v) => !v)} />
      <Sidebar />
      {navOpen && isMobile && (
        <button
          type="button"
          className="admin-layout__overlay"
          aria-label="Close navigation"
          onClick={() => setNavOpen(false)}
        />
      )}
      <main className="admin-layout__main">
        <Outlet />
      </main>
    </div>
  );
}
