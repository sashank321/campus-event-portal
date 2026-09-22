import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { safeReturn } from '../../lib/events';

export default function RequireAdmin({ children }) {
  const auth = useAuth();
  const location = useLocation();
  const returnTo = safeReturn(`${location.pathname}${location.search}${location.hash}`);

  if (auth.loading) {
    return (
      <div className="container page">
        <p className="notice" role="status">Verifying campus administrator credentials…</p>
      </div>
    );
  }

  if (auth.error) {
    return (
      <div className="container page">
        <section className="panel stack" role="alert">
          <h1>We couldn’t verify your account.</h1>
          <p>Please retry before opening the administration control center.</p>
          <button type="button" className="button button-secondary" onClick={() => void auth.refresh()}>
            Retry account
          </button>
          <Link className="text-link" to="/events">Back to events</Link>
        </section>
      </div>
    );
  }

  if (!auth.user) {
    return <Navigate to={`/login?${new URLSearchParams({ returnTo })}`} replace />;
  }

  if (auth.user.isActive === false) {
    return (
      <div className="container page">
        <section className="panel stack" role="alert">
          <p className="eyebrow">ADMINISTRATION CONTROL</p>
          <h1>This administrator account is inactive.</h1>
          <p>Please contact IT Services or the primary portal administrator to restore system access.</p>
          <Link className="button button-secondary" to="/events">Back to events</Link>
        </section>
      </div>
    );
  }

  if (auth.user.role !== 'admin') {
    return (
      <div className="container page">
        <section className="panel stack" role="alert">
          <p className="eyebrow">ACCESS RESTRICTED</p>
          <h1>Campus Administrator Authorization Required</h1>
          <p>
            The administrative control room is restricted to verified campus system administrators.
            Your account is currently signed in as <strong>{auth.user.name}</strong> with role <code>{auth.user.role}</code>.
          </p>
          <div className="heading-actions" style={{ marginTop: '1rem' }}>
            <Link className="button" to="/events">Explore campus events</Link>
            {auth.user.role === 'organizer' && (
              <Link className="button button-secondary" to="/organizer">Organizer Console</Link>
            )}
            {auth.user.role === 'student' && (
              <Link className="button button-secondary" to="/student/registrations">My registrations</Link>
            )}
          </div>
        </section>
      </div>
    );
  }

  return children;
}
