import { NavLink, Outlet, Link } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';
import './organizer.css';

export default function OrganizerLayout() {
  const auth = useAuth();
  const name = auth.user?.name || 'Organizer';

  return (
    <div className="container page organizer-console">
      <header className="console-header">
        <div>
          <p className="eyebrow">ORGANIZER CONSOLE</p>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700, margin: '0.25rem 0' }}>
            Campus Event Operations
          </h1>
          <p className="muted" style={{ fontSize: '0.875rem', margin: 0 }}>
            Signed in as <strong>{name}</strong> ({auth.user?.role})
          </p>
        </div>
        <div className="heading-actions" style={{ gap: '0.5rem' }}>
          <Link className="button button-small" to="/organizer/events/new">
            + Create event
          </Link>
          <Link className="button button-small button-secondary" to="/events">
            Public portal ↗
          </Link>
        </div>
      </header>

      <nav className="console-nav" aria-label="Organizer navigation">
        <NavLink to="/organizer" end className={({ isActive }) => `console-nav-link ${isActive ? 'active' : ''}`}>
          Overview
        </NavLink>
        <NavLink to="/organizer/events" className={({ isActive }) => `console-nav-link ${isActive ? 'active' : ''}`}>
          Managed Events
        </NavLink>
        <NavLink to="/organizer/events/new" className={({ isActive }) => `console-nav-link ${isActive ? 'active' : ''}`}>
          New Event
        </NavLink>
      </nav>

      <main id="organizer-main">
        <Outlet />
      </main>
    </div>
  );
}
