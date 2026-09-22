import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';
import { Sheet } from '../ui';

const primaryLinks = (isStudent, isOrganizer, isAdmin) => (
  <>
    <NavLink to="/events">Events</NavLink>
    <NavLink to="/clubs">Clubs</NavLink>
    {isStudent && <><NavLink to="/student/registrations">My Events</NavLink><NavLink to="/student" end>Account</NavLink></>}
    {isOrganizer && <NavLink to="/organizer">Console</NavLink>}
    {isAdmin && <NavLink to="/admin">Admin</NavLink>}
  </>
);

const accountArea = (auth, isStudent, isOrganizer, isAdmin) => {
  if (auth.loading) return <span className="muted">Checking session…</span>;
  if (!auth.user) return <><Link to="/login">Log in</Link><Link className="button button-small" to="/register">Join the campus ↗</Link></>;
  const label = isAdmin
    ? <Link className="account-name" to="/admin" title="Admin Control Center">{auth.user.name}</Link>
    : isStudent
    ? <Link className="account-name" to="/student" title="Account">{auth.user.name}</Link>
    : isOrganizer
    ? <Link className="account-name" to="/organizer" title="Organizer Console">{auth.user.name}</Link>
    : <span className="account-name" title="Account">{auth.user.name}</span>;
  return <>{label}<button className="text-button" onClick={auth.logout}>Log out</button></>;
};

export default function Layout() {
  const location = useLocation();
  const auth = useAuth();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    setOpen(false);
    if (window.__lenis) {
      window.__lenis.scrollTo(0, { immediate: true });
    } else {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
    document.title = `${location.pathname === '/' ? 'Beyond the everyday' : location.pathname.split('/')[1]} · Campus Events`;
  }, [location.pathname]);
  useEffect(() => { const update = () => setScrolled(window.scrollY > 24); update(); window.addEventListener('scroll', update, { passive: true }); return () => window.removeEventListener('scroll', update); }, []);
  const isStudent = auth.user?.role === 'student' && auth.user.isActive !== false;
  const isOrganizer = (auth.user?.role === 'organizer' || auth.user?.role === 'admin') && auth.user.isActive !== false;
  const isAdmin = auth.user?.role === 'admin' && auth.user.isActive !== false;
  const account = accountArea(auth, isStudent, isOrganizer, isAdmin);
  return <><a href="#main" className="skip-link">Skip to content</a>{location.pathname !== '/' && <header className={`navbar ${auth.user ? 'navbar-authenticated' : ''} ${scrolled || location.pathname !== '/' ? 'navbar-solid' : ''}`}><div className="container nav-inner"><Link className="brand" to="/" aria-label="Campus Events home"><span className="brand-mark" aria-hidden="true">✳</span><span>CAMPUS<span>EVENTS</span></span></Link><nav className="desktop-nav" aria-label="Primary navigation">{primaryLinks(isStudent, isOrganizer, isAdmin)}</nav><div className="nav-account">{account}</div><button className="icon-button menu-toggle" aria-label="Open navigation" aria-expanded={open} onClick={() => setOpen(true)}>☰</button></div></header>}
    <Sheet open={open} onClose={() => setOpen(false)} title="Navigation"><nav className="mobile-nav" aria-label="Mobile navigation" onClick={(e) => { if (e.target.closest('a')) setOpen(false); }}>{primaryLinks(isStudent, isOrganizer, isAdmin)}{account}</nav></Sheet>
    {auth.error && <div className="session-notice" role="status">Account connection unavailable. Public events are still accessible. <button className="text-button" onClick={auth.refresh}>Retry account</button></div>}
    <main id="main" tabIndex={-1}><div key={location.pathname} className="page-enter"><Outlet /></div></main>
    {location.pathname !== '/' && <footer className="container footer"><Link className="brand" to="/"><span className="brand-mark" aria-hidden="true">✳</span> CAMPUS EVENTS</Link><p>A little less routine. A little more you.</p><nav aria-label="Footer"><Link to="/events">Events ↗</Link><Link to="/clubs">Clubs ↗</Link></nav><span className="footer-bottom">MADE FOR CAMPUS LIFE <span>SHOW UP. BE PART OF IT.</span></span></footer>}
  </>;
}
