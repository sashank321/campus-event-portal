import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { safeReturn } from '../../lib/events';

export default function RequireOrganizer({ children }) {
  const auth = useAuth();
  const location = useLocation();
  const returnTo = safeReturn(`${location.pathname}${location.search}${location.hash}`);

  if (auth.loading) {
    return (
      <div className="container page">
        <p className="notice" role="status">Checking your organizer session…</p>
      </div>
    );
  }

  if (auth.error) {
    return (
      <div className="container page">
        <section className="panel stack" role="alert">
          <h1>We couldn’t check your account.</h1>
          <p>Please retry before opening the organizer console.</p>
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
        <section className="panel stack">
          <p className="eyebrow">ORGANIZER CONSOLE</p>
          <h1>This account is inactive.</h1>
          <p>Please contact campus support to restore access.</p>
          <Link className="button button-secondary" to="/events">Back to events</Link>
        </section>
      </div>
    );
  }

  if (auth.user.role !== 'organizer' && auth.user.role !== 'admin') {
    return (
      <div className="container page">
        <section className="panel stack" role="alert">
          <p className="eyebrow">ORGANIZER CONSOLE</p>
          <h1>This space is for event organizers.</h1>
          <p>
            Event publishing and participant management tools are available to authorized organizers and faculty coordinators.
            Your account is currently signed in as {auth.user.role}.
          </p>
          <div className="heading-actions">
            <Link className="button" to="/events">Explore campus events</Link>
            <Link className="button button-secondary" to="/student/registrations">My registrations</Link>
          </div>
        </section>
      </div>
    );
  }

  return children;
}
