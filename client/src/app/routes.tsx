import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '@features/auth/useAuth';
import { LoginPage } from '@/pages/LoginPage';
import { AdminLayout } from './AdminLayout';
import { DashboardPage } from '@/pages/DashboardPage';
import { FormBuilderPage } from '@/pages/FormBuilderPage';
import { TablesPage } from '@/pages/TablesPage';
import { ApiBuilderPage } from '@/pages/ApiBuilderPage';
import { SettingsPage } from '@/pages/SettingsPage';

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
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
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
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}
