import { NavLink, Outlet, Link } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';
import './admin.css';

export default function AdminLayout() {
  const auth = useAuth();
  const name = auth.user?.name || 'Administrator';

  return (
    <div className="container page admin-center">
      <header className="admin-header">
        <div>
          <p className="eyebrow" style={{ color: '#38bdf8' }}>ADMINISTRATION & CONTROL</p>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700, margin: '0.25rem 0' }}>
            Campus Administration Center
          </h1>
          <p className="muted" style={{ fontSize: '0.875rem', margin: 0 }}>
            Operational control room · Signed in as <strong>{name}</strong> ({auth.user?.role})
          </p>
        </div>
        <div className="heading-actions" style={{ gap: '0.5rem' }}>
          <Link className="button button-small button-secondary" to="/organizer">
            Organizer Console ↗
          </Link>
          <Link className="button button-small button-secondary" to="/events">
            Public Portal ↗
          </Link>
        </div>
      </header>

      <nav className="admin-nav" aria-label="Admin navigation">
        <NavLink to="/admin" end className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}>
          Overview
        </NavLink>
        <NavLink to="/admin/events" className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}>
          Moderation Queue
        </NavLink>
        <NavLink to="/admin/users" className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}>
          Users
        </NavLink>
        <NavLink to="/admin/clubs" className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}>
          Clubs
        </NavLink>
        <NavLink to="/admin/venues" className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}>
          Venues
        </NavLink>
        <NavLink to="/admin/registrations" className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}>
          Registrations
        </NavLink>
        <NavLink to="/admin/statistics" className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}>
          Statistics
        </NavLink>
      </nav>

      <main id="admin-main">
        <Outlet />
      </main>
    </div>
  );
}
