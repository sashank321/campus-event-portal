import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { safeReturn } from '../../lib/events';

// Frontend convenience only; student endpoints still authorize the session.
export default function RequireStudent({ children }) {
  const auth = useAuth();
  const location = useLocation();
  const returnTo = safeReturn(`${location.pathname}${location.search}${location.hash}`);

  if (auth.loading) return <div className="container page"><p className="notice" role="status">Checking your session…</p></div>;
  if (auth.error) return <div className="container page"><section className="panel stack" role="alert"><h1>We couldn’t check your account.</h1><p>Please retry before opening your student area.</p><button type="button" className="button button-secondary" onClick={() => { void auth.refresh(); }}>Retry account</button><Link className="text-link" to="/events">Back to events</Link></section></div>;
  if (!auth.user) return <Navigate to={`/login?${new URLSearchParams({ returnTo })}`} replace />;
  if (auth.user.isActive === false) return <div className="container page"><section className="panel stack"><p className="eyebrow">STUDENT AREA</p><h1>This account is inactive.</h1><p>Please contact campus support to restore access.</p><Link className="button button-secondary" to="/events">Back to events</Link></section></div>;
  if (auth.user.role !== 'student') {
    return <div className="container page"><section className="panel stack"><p className="eyebrow">STUDENT AREA</p><h1>This space is for students.</h1><p>Event registration and personal itineraries are available to student accounts. Your account is signed in as {auth.user.role}.</p><Link className="button button-secondary" to="/events">Back to events</Link></section></div>;
  }
  return children;
}
