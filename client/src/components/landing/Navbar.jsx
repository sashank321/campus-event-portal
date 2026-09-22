import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { useAuth } from '../../features/auth/AuthContext';

const NAV_LINKS = [
  { label: 'Events', href: '#events' },
  { label: 'Categories', href: '#categories' },
  { label: 'Architecture', href: '#architecture' },
  { label: 'Clubs', href: '#clubs' },
  { label: 'Community', href: '#community' },
];

export default function Navbar() {
  const navigate = useNavigate();
  const auth = useAuth();
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (e, href) => {
    if (href.startsWith('#')) {
      e.preventDefault();
      const element = document.querySelector(href);
      if (element) {
        if (window.__lenis) {
          window.__lenis.scrollTo(element, { offset: -80, duration: 1.15 });
        } else {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      } else {
        navigate('/' + href);
      }
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-8 lg:px-16 py-5 transition-[background-color,border-color,backdrop-filter,box-shadow] duration-500 ease-out ${
        scrolled
          ? 'bg-hero-bg/90  border-b border-border/40 shadow-xl'
          : 'bg-transparent backdrop-blur-[2px]'
      }`}
    >
      {/* Left: Logo text */}
      <Link
        to="/"
        className="text-foreground text-xl font-semibold tracking-tight hover:opacity-90 transition-opacity flex items-center gap-1.5"
      >
        <span>CAMPUS</span>
        <span className="text-primary text-xs font-bold px-1.5 py-0.5 rounded bg-primary/10 border border-primary/20 tracking-wider">
          LIVE
        </span>
      </Link>

      {/* Center: Nav links array */}
      <nav className="hidden md:flex items-center gap-8" aria-label="Landing navigation">
        {NAV_LINKS.map((link) => (
          <a
            key={link.label}
            href={link.href}
            onClick={(e) => handleNavClick(e, link.href)}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest cursor-pointer"
          >
            {link.label}
          </a>
        ))}
      </nav>

      {/* Right: CTA button using shadcn Button with custom navCta variant */}
      <div className="flex items-center gap-3">
        {auth?.user ? (
          <Button
            variant="navCta"
            size="lg"
            className="rounded-lg uppercase text-xs tracking-widest px-6"
            onClick={() => {
              if (auth.user.role === 'admin') navigate('/admin');
              else if (auth.user.role === 'organizer') navigate('/organizer');
              else navigate('/student');
            }}
          >
            Dashboard
          </Button>
        ) : (
          <Button
            variant="navCta"
            size="lg"
            className="hidden md:inline-flex rounded-lg uppercase text-xs tracking-widest px-6"
            onClick={() => navigate('/events')}
          >
            Get Started
          </Button>
        )}
      </div>
    </header>
  );
}
