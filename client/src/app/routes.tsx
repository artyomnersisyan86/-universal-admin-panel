import { Navigate, Route, Routes, useParams } from 'react-router-dom';
import { useAuth } from '@features/auth/useAuth';
import { LoginPage } from '@/pages/LoginPage';
import { AdminLayout } from './AdminLayout';
import { DashboardPage } from '@/pages/DashboardPage';
import { FormBuilderPage } from '@/pages/FormBuilderPage';
import { TablesPage } from '@/pages/TablesPage';
import { ApiBuilderPage } from '@/pages/ApiBuilderPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { SectionsPage } from '@/pages/SectionsPage';
import { SectionBuilderPage } from '@/pages/SectionBuilderPage';
import { SectionEntriesPage } from '@/pages/SectionEntriesPage';
import { EntryEditorPage } from '@/pages/EntryEditorPage';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RequireRole({
  role,
  children,
}: {
  role: 'superadmin' | 'admin';
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (role === 'superadmin' && user.role !== 'superadmin') {
    return <Navigate to="/settings" replace />;
  }
  return <>{children}</>;
}

/** Redirect a legacy `/:base/:id` route to its new home under /settings. */
function RedirectWithId({ base }: { base: string }) {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={`${base}/${id ?? ''}`} replace />;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <AdminLayout />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />

        {/* Dynamic section content (admins manage entries here). */}
        <Route path="c/:slug" element={<SectionEntriesPage />} />
        <Route path="c/:slug/new" element={<EntryEditorPage />} />
        <Route path="c/:slug/:entryId" element={<EntryEditorPage />} />

        {/* Settings hub — builders + section management live here. */}
        <Route path="settings" element={<SettingsPage />}>
          <Route index element={<Navigate to="form-builder" replace />} />
          <Route
            path="sections"
            element={
              <RequireRole role="superadmin">
                <SectionsPage />
              </RequireRole>
            }
          />
          <Route
            path="sections/:id"
            element={
              <RequireRole role="superadmin">
                <SectionBuilderPage />
              </RequireRole>
            }
          />
          <Route path="form-builder" element={<FormBuilderPage />} />
          <Route path="form-builder/:id" element={<FormBuilderPage />} />
          <Route path="tables" element={<TablesPage />} />
          <Route path="tables/:id" element={<TablesPage />} />
          <Route
            path="api-builder"
            element={
              <RequireRole role="superadmin">
                <ApiBuilderPage />
              </RequireRole>
            }
          />
        </Route>

        {/* Legacy top-level paths → new /settings homes. */}
        <Route path="sections" element={<Navigate to="/settings/sections" replace />} />
        <Route path="sections/:id" element={<RedirectWithId base="/settings/sections" />} />
        <Route path="form-builder" element={<Navigate to="/settings/form-builder" replace />} />
        <Route path="form-builder/:id" element={<RedirectWithId base="/settings/form-builder" />} />
        <Route path="tables" element={<Navigate to="/settings/tables" replace />} />
        <Route path="tables/:id" element={<RedirectWithId base="/settings/tables" />} />
        <Route path="api-builder" element={<Navigate to="/settings/api-builder" replace />} />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}
