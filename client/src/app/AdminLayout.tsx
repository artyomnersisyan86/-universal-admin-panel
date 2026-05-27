import { Outlet } from 'react-router-dom';
import { TopBar } from './TopBar';
import { Sidebar } from './Sidebar';
import './AdminLayout.css';

export function AdminLayout() {
  return (
    <div className="admin-layout">
      <TopBar />
      <Sidebar />
      <main className="admin-layout__main">
        <Outlet />
      </main>
    </div>
  );
}
