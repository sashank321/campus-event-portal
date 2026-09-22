import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { eventsRequest } from '../api/client';
import { categories, titleCase } from '../lib/events';
import { Skeleton, ErrorState, EmptyState } from '../components/ui';
import EventCard from '../components/events/EventCard';
import Carousel from '../components/events/Carousel';
import Navbar from '../components/landing/Navbar';
import HeroSection from '../components/landing/HeroSection';
import { Button } from '../components/ui/button';

import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function Home() {
  const navigate = useNavigate();
  const [from] = useState(() => new Date().toISOString());

  const query = useQuery({
    queryKey: ['events', 'home', from],
    queryFn: ({ signal }) => eventsRequest({ from, limit: 12, sort: 'startAt' }, signal),
  });

  const events = query.data?.data || [];
  const featured = events.filter((event) => event.isFeatured);
  const highlights = featured.length ? featured : events.slice(0, 5);

  // Derive recognized clubs from active events
  const clubs = [
    ...new Map(
      events
        .filter((event) => event.club?.slug)
        .map((event) => [event.club.slug, event.club])
    ).values(),
  ];

  const CLUB_PROFILES = {
    'coding-club': {
      domain: 'Software & Systems',
      description: 'Competitive programming, kernel architecture sprints, and 24-hour hackathon operations.',
      members: '1,200+ members',
    },
    'robotics-club': {
      domain: 'Autonomous Hardware',
      description: 'Combat robotics, drone swarm kinematics, and ROS2 autonomous navigation teams.',
      members: '650+ members',
    },
    'sports-club': {
      domain: 'Athletics & Fitness',
      description: 'Inter-university leagues, high-performance strength training, and intramural tournament cups.',
      members: '900+ members',
    },
    'cultural-club': {
      domain: 'Arts & Production',
      description: 'Annual intra-campus cultural showcases, theatrical choreography, and live acoustic recitals.',
      members: '1,400+ members',
    },
    'design-syndicate': {
      domain: 'Interface & Spatial',
      description: 'Product design teardowns, typography workshops, and human-computer interaction research.',
      members: '480+ members',
    },
    'entrepreneurship-cell': {
      domain: 'Venture & Incubation',
      description: 'Student venture scouting, seed pitch competitions, and angel founder masterclasses.',
      members: '720+ members',
    },
  };

  // Default fallback clubs if events have no club data yet
  const displayClubs = clubs.length
    ? clubs
    : [
        { name: 'Coding Club', slug: 'coding-club' },
        { name: 'Robotics Society', slug: 'robotics-club' },
        { name: 'Sports Council', slug: 'sports-club' },
        { name: 'Cultural Committee', slug: 'cultural-club' },
        { name: 'Design Syndicate', slug: 'design-syndicate' },
        { name: 'Entrepreneurship Cell', slug: 'entrepreneurship-cell' },
      ];

  useGSAP(() => {
    // Ticker animation
    gsap.to('.gsap-ticker', {
      xPercent: -50,
      ease: 'none',
      duration: 28,
      repeat: -1,
    });

    // Section reveal animations
    gsap.utils.toArray('.gsap-section').forEach((section) => {
      gsap.fromTo(
        section,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.75,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 85%',
          },
        }
      );
    });

    // Staggered children reveal
    gsap.utils.toArray('.gsap-stagger-container').forEach((container) => {
      const items = container.querySelectorAll('.gsap-stagger-item');
      if (!items.length) return;
      gsap.fromTo(
        items,
        { opacity: 0, y: 30, scale: 0.98 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.6,
          stagger: 0.08,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: container,
            start: 'top 85%',
          },
        }
      );
    });
  }, []);

  return (
    <div className="bg-hero-bg text-foreground min-h-screen selection:bg-primary selection:text-primary-foreground">
      {/* 1. Floating Transparent Navbar */}
      <Navbar />

      {/* 2. Full-Screen Dark Hero Section with Spline 3D Embed */}
      <HeroSection />

      {/* 3. Live Metrics / Infinite Running Marquee Bar */}
      <div className="relative border-y border-white/[0.08] bg-black/40  py-4 overflow-hidden" aria-hidden="true">
        <div
          className="gsap-ticker flex items-center gap-8 text-xs font-semibold uppercase tracking-widest text-muted-foreground whitespace-nowrap w-max"
        >
          {[...Array(2)].map((_, groupIdx) => (
            <div key={groupIdx} className="flex items-center gap-8">
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                LIVE CAMPUS CALENDAR
              </span>
              <span className="text-primary font-bold">✳</span>
              <span>50+ VERIFIED EVENTS</span>
              <span className="text-primary font-bold">✳</span>
              <span>ACID SEAT CONCURRENCY</span>
              <span className="text-primary font-bold">✳</span>
              <span>INSTANT DIGITAL QR PASS</span>
              <span className="text-primary font-bold">✳</span>
              <span>ZERO REGISTRATION OVERSELL</span>
              <span className="text-primary font-bold">✳</span>
              <span>20+ RECOGNIZED CLUBS</span>
              <span className="text-primary font-bold">✳</span>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Section: Events Spotlight Carousel (#events) */}
      <section
        id="events"
        className="relative py-24 px-6 md:px-12 lg:px-20 max-w-7xl mx-auto gsap-section">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs text-primary font-medium tracking-wider uppercase mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              CURATED EXPERIENCES
            </div>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground">
              In The <span className="text-primary">Spotlight</span>
            </h2>
            <p className="text-muted-foreground text-sm md:text-base font-light mt-2 max-w-xl">
              Handpicked experiences happening across campus. Real-time seat reservation with instant confirmation.
            </p>
          </div>
          <Link
            to="/events"
            className="text-sm text-primary hover:underline flex items-center gap-1.5 font-medium tracking-wide"
>
            The full calendar ↗
          </Link>
        </div>

        {query.isPending ? (
          <Skeleton count={1} />
        ) : query.isError ? (
          <ErrorState error={query.error} retry={query.refetch} />
        ) : highlights.length ? (
          <div className="space-y-12">
            <Carousel events={highlights} />

            {/* Upcoming Events Grid Preview */}
            <div className="pt-8">
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-border/40">
                <h3 className="text-xl font-bold text-foreground tracking-tight">
                  Upcoming <span className="text-primary">Schedule</span>
                </h3>
                <Link to="/events" className="text-xs text-muted-foreground hover:text-foreground uppercase tracking-widest">
                  View all ({events.length}) ↗
                </Link>
              </div>

              <div
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 gsap-stagger-container">
                {events.slice(0, 6).map((event) => (
                  <div key={event._id} className="gsap-stagger-item">
                    <EventCard event={event} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <EmptyState>
            <p className="text-muted-foreground">The next chapter is being planned. Check back for upcoming campus events.</p>
            <Link to="/clubs" className="text-primary hover:underline mt-2 inline-block">
              Explore the community ↗
            </Link>
          </EmptyState>
        )}
      </section>

      {/* 5. Section: Explore By Category (#categories) */}
      <section
        id="categories"
        className="relative py-24 px-6 md:px-12 lg:px-20 max-w-7xl mx-auto border-t border-border/40 gsap-section">
        <div className="max-w-2xl mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs text-primary font-medium tracking-wider uppercase mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            BROWSE BY DOMAIN
          </div>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground">
            Follow Your <span className="text-primary">Curiosity</span>
          </h2>
          <p className="text-muted-foreground text-sm md:text-base font-light mt-2">
            Go all in on what you love, or branch out into a completely new discipline.
          </p>
        </div>

        <div
          className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 gsap-stagger-container">
          {categories.map((category, i) => {
            const icons = {
              workshop: (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <polyline points="16 18 22 12 16 6" strokeLinecap="round" strokeLinejoin="round" />
                  <polyline points="8 6 2 12 8 18" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ),
              fest: (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" strokeLinecap="round" />
                </svg>
              ),
              competition: (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <path d="M6 9H3a2 2 0 01-2-2V5a2 2 0 012-2h3m12 6h3a2 2 0 002-2V5a2 2 0 00-2-2h-3M6 3h12v7a6 6 0 01-12 0V3zM9 21h6m-3-4v4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ),
              seminar: (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <path d="M12 2a3 3 0 00-3 3v7a3 3 0 006 0V5a3 3 0 00-3-3zM19 10v2a7 7 0 01-14 0v-2M12 19v4m-4 0h8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ),
              hackathon: (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ),
              sports: (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <circle cx="12" cy="12" r="9" strokeLinecap="round" />
                  <path d="M12 3c3.5 3.5 3.5 14.5 0 18M3 12c3.5 3.5 14.5 3.5 18 0" strokeLinecap="round" />
                </svg>
              ),
              cultural: (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <path d="M9 18V5l12-2v13M9 18a3 3 0 11-6 0 3 3 0 016 0zm12-2a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ),
              other: (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <circle cx="12" cy="12" r="9" />
                  <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="currentColor" fillOpacity="0.2" />
                </svg>
              ),
            };
            const icon = icons[category.toLowerCase()] || icons.other;

            return (
              <div key={category} className="gsap-stagger-item">
                <Link
                  to={`/events?category=${category}`}
                  className="group relative p-6 rounded-2xl bg-white/[0.02] hover:bg-white/[0.045] border border-white/[0.08] hover:border-primary/50  transition-all duration-300 shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.06),0_16px_36px_-12px_rgba(0,0,0,0.6)] hover:shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.12),0_20px_40px_-12px_rgba(0,0,0,0.8),0_0_25px_rgba(52,211,153,0.08)] flex flex-col justify-between min-h-[160px] h-full"
>
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.08] group-hover:border-primary/40 group-hover:bg-primary/10 flex items-center justify-center text-muted-foreground group-hover:text-primary transition-all duration-300">
                      {icon}
                    </div>
                    <span className="font-mono text-xs text-muted-foreground/60 group-hover:text-primary transition-colors">
                      {String(i + 1).padStart(2, '0')} ↗
                    </span>
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors">
                      {titleCase(category)}
                    </h3>
                    <p className="text-xs text-muted-foreground font-light mt-1">Explore category</p>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* 6. Section: Architecture / Engineered for Reliability (#architecture) */}
      <section
        id="architecture"
        className="relative py-24 px-6 md:px-12 lg:px-20 max-w-7xl mx-auto border-t border-border/40 scroll-mt-24 gsap-section">
        <div className="max-w-3xl mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs text-primary font-medium tracking-wider uppercase mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            ENTERPRISE ARCHITECTURE
          </div>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground">
            Engineered for <span className="text-primary">Zero Concurrency Loss</span>
          </h2>
          <p className="text-muted-foreground text-sm md:text-base font-light mt-3 max-w-2xl leading-relaxed">
            Enterprise campus registration infrastructure powered by multi-document MongoDB replica set transactions. Every seat allocation is atomic, instantaneous, and verifiable.
          </p>
        </div>

        <div
          className="grid grid-cols-1 md:grid-cols-3 gap-6 gsap-stagger-container">
          {/* Card 1: Distributed Engine */}
          <div
            className="gsap-stagger-item p-8 rounded-2xl bg-white/[0.02] hover:bg-white/[0.045] border border-white/[0.08] hover:border-primary/40  transition-colors duration-300 shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.06),0_16px_36px_-12px_rgba(0,0,0,0.7)] flex flex-col justify-between group h-full"
>
            <div>
              {/* Bespoke SVG schematic for Distributed Nodes */}
              <div className="w-full h-24 mb-6 rounded-xl bg-black/40 border border-white/[0.06] p-3 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(52,211,153,0.08)_0%,_transparent_70%)]" />
                <svg className="w-full h-full max-w-[200px]" viewBox="0 0 200 70" fill="none">
                  <line x1="45" y1="35" x2="100" y2="35" stroke="rgba(52,211,153,0.3)" strokeWidth="1.5" strokeDasharray="3 3" />
                  <line x1="100" y1="35" x2="155" y2="35" stroke="rgba(52,211,153,0.3)" strokeWidth="1.5" strokeDasharray="3 3" />
                  <rect x="25" y="20" width="36" height="30" rx="6" fill="#0c1410" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                  <circle cx="35" cy="35" r="2.5" fill="#34d399" />
                  <line x1="42" y1="32" x2="53" y2="32" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
                  <line x1="42" y1="38" x2="50" y2="38" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                  <rect x="82" y="16" width="40" height="38" rx="8" fill="#122319" stroke="#34d399" strokeWidth="1.5" />
                  <circle cx="94" cy="35" r="3" fill="#34d399" className="animate-ping" />
                  <circle cx="94" cy="35" r="3" fill="#34d399" />
                  <line x1="102" y1="31" x2="114" y2="31" stroke="#ffffff" strokeWidth="1.5" />
                  <line x1="102" y1="37" x2="110" y2="37" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
                  <line x1="102" y1="43" x2="112" y2="43" stroke="#34d399" strokeWidth="1" />
                  <rect x="139" y="20" width="36" height="30" rx="6" fill="#0c1410" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                  <circle cx="149" cy="35" r="2.5" fill="#34d399" />
                  <line x1="156" y1="32" x2="167" y2="32" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
                  <line x1="156" y1="38" x2="164" y2="38" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                </svg>
              </div>
              <div className="text-[11px] font-mono text-primary/80 uppercase tracking-widest mb-2">
                01 / TRANSACTION CONCURRENCY
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">ACID Seat Allocation</h3>
              <p className="text-sm text-muted-foreground font-light leading-relaxed">
                Multi-document replica set transactions enforce strict seat limits at the database engine level, eliminating double bookings even under hundred-user ticket drops.
              </p>
            </div>
            <div className="pt-6 mt-6 border-t border-white/[0.06] flex items-center justify-between text-xs text-muted-foreground font-mono">
              <span>ENGINE: RS0</span>
              <span className="text-primary flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                ACTIVE REPLICA
              </span>
            </div>
          </div>

          {/* Card 2: Cryptographic Pass */}
          <div
            className="gsap-stagger-item p-8 rounded-2xl bg-white/[0.02] hover:bg-white/[0.045] border border-white/[0.08] hover:border-primary/40  transition-colors duration-300 shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.06),0_16px_36px_-12px_rgba(0,0,0,0.7)] flex flex-col justify-between group h-full"
>
            <div>
              {/* Bespoke SVG schematic for Digital QR Pass */}
              <div className="w-full h-24 mb-6 rounded-xl bg-black/40 border border-white/[0.06] p-3 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(52,211,153,0.08)_0%,_transparent_70%)]" />
                <svg className="w-full h-full max-w-[200px]" viewBox="0 0 200 70" fill="none">
                  <rect x="35" y="14" width="130" height="42" rx="6" fill="#0d1410" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
                  <line x1="82" y1="14" x2="82" y2="56" stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeDasharray="2 2" />
                  <rect x="46" y="24" width="22" height="22" rx="2" fill="none" stroke="#34d399" strokeWidth="1.5" />
                  <rect x="50" y="28" width="5" height="5" fill="#34d399" />
                  <rect x="59" y="28" width="5" height="5" fill="#34d399" />
                  <rect x="50" y="37" width="5" height="5" fill="#34d399" />
                  <circle cx="61.5" cy="39.5" r="1.5" fill="#34d399" />
                  <line x1="94" y1="24" x2="145" y2="24" stroke="#ffffff" strokeWidth="1.5" />
                  <line x1="94" y1="31" x2="135" y2="31" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
                  <line x1="94" y1="38" x2="152" y2="38" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                  <circle cx="150" cy="24" r="2" fill="#34d399" />
                </svg>
              </div>
              <div className="text-[11px] font-mono text-primary/80 uppercase tracking-widest mb-2">
                02 / DIGITAL IDENTITY
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Instant Digital Pass</h3>
              <p className="text-sm text-muted-foreground font-light leading-relaxed">
                Upon booking confirmation, students receive an instant verifiable digital entry pass in their wallet with unique cryptographic registration IDs for check-in.
              </p>
            </div>
            <div className="pt-6 mt-6 border-t border-white/[0.06] flex items-center justify-between text-xs text-muted-foreground font-mono">
              <span>FORMAT: QR-ECDSA</span>
              <span className="text-primary flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                CRYPTO VERIFIED
              </span>
            </div>
          </div>

          {/* Card 3: Zero Trust Moderation */}
          <div
            className="gsap-stagger-item p-8 rounded-2xl bg-white/[0.02] hover:bg-white/[0.045] border border-white/[0.08] hover:border-primary/40  transition-colors duration-300 shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.06),0_16px_36px_-12px_rgba(0,0,0,0.7)] flex flex-col justify-between group h-full"
>
            <div>
              {/* Bespoke SVG schematic for Security Shield */}
              <div className="w-full h-24 mb-6 rounded-xl bg-black/40 border border-white/[0.06] p-3 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(52,211,153,0.08)_0%,_transparent_70%)]" />
                <svg className="w-full h-full max-w-[200px]" viewBox="0 0 200 70" fill="none">
                  <circle cx="100" cy="35" r="26" stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="3 3" />
                  <circle cx="100" cy="35" r="20" stroke="rgba(52,211,153,0.15)" strokeWidth="1" />
                  <path d="M100 18L114 24V36C114 44 108 49 100 52C92 49 86 44 86 36V24L100 18Z" fill="#102217" stroke="#34d399" strokeWidth="1.5" />
                  <path d="M94 35L98 39L106 31" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="text-[11px] font-mono text-primary/80 uppercase tracking-widest mb-2">
                03 / ACCESS GOVERNANCE
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Zero-Trust Moderation</h3>
              <p className="text-sm text-muted-foreground font-light leading-relaxed">
                Every club event proposal undergoes administrative verification and role-based access control, ensuring verified venues, accurate capacities, and trusted safety.
              </p>
            </div>
            <div className="pt-6 mt-6 border-t border-white/[0.06] flex items-center justify-between text-xs text-muted-foreground font-mono">
              <span>RBAC: ENFORCED</span>
              <span className="text-primary flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                AUDITED LOGS
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Section: Recognized Campus Clubs (#clubs) */}
      <section
        id="clubs"
        className="relative py-24 px-6 md:px-12 lg:px-20 max-w-7xl mx-auto border-t border-border/40 scroll-mt-24 gsap-section">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs text-primary font-medium tracking-wider uppercase mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              STUDENT BODIES
            </div>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground">
              Recognized <span className="text-primary">Campus Clubs</span>
            </h2>
            <p className="text-muted-foreground text-sm md:text-base font-light mt-2 max-w-xl">
              Meet the student organizers, hackathon squads, and cultural societies shaping campus life.
            </p>
          </div>
          <Link
            to="/clubs"
            className="text-sm text-primary hover:underline flex items-center gap-1.5 font-medium tracking-wide"
>
            All 20+ clubs ↗
          </Link>
        </div>

        <div
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 gsap-stagger-container">
          {displayClubs.slice(0, 6).map((club, i) => {
            const profile = CLUB_PROFILES[club.slug] || {
              domain: 'Campus Chapter',
              description: club.description || 'Active campus chapter hosting workshops, hackathons, and community sessions.',
              members: '500+ members',
            };

            return (
              <div key={club.slug || i} className="gsap-stagger-item">
                <Link
                  to={`/clubs/${club.slug}`}
                  className="group p-6 rounded-2xl bg-white/[0.02] hover:bg-white/[0.045] border border-white/[0.08] hover:border-primary/50  transition-all duration-300 shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.06),0_16px_36px_-12px_rgba(0,0,0,0.7)] hover:shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.12),0_20px_40px_-12px_rgba(0,0,0,0.8),0_0_25px_rgba(52,211,153,0.08)] flex flex-col justify-between h-full"
>
                  <div>
                    <div className="flex items-start justify-between mb-6">
                      <div className="w-12 h-12 rounded-xl bg-white/[0.03] border border-white/[0.1] group-hover:border-primary/50 group-hover:bg-primary/10 flex items-center justify-center text-primary font-bold text-base transition-all duration-300 shadow-inner">
                        {club.name?.slice(0, 2).toUpperCase() || 'CC'}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.08] text-[10px] font-mono text-muted-foreground">
                          <span className="w-1 h-1 rounded-full bg-primary" />
                          VERIFIED
                        </span>
                        <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors font-mono">
                          {String(i + 1).padStart(2, '0')} ↗
                        </span>
                      </div>
                    </div>

                    <div className="text-[11px] font-mono text-primary/80 uppercase tracking-wider mb-1.5">
                      {profile.domain}
                    </div>
                    <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                      {club.name}
                    </h3>
                    <p className="text-xs text-muted-foreground font-light mt-2 line-clamp-2 leading-relaxed">
                      {profile.description}
                    </p>
                  </div>

                  <div className="pt-4 mt-6 border-t border-white/[0.06] flex items-center justify-between text-xs text-muted-foreground font-mono">
                    <span>{profile.members}</span>
                    <span className="text-foreground/70 group-hover:text-primary transition-colors">
                      View Chapter →
                    </span>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* 8. High-Impact Call To Action Banner (#community) */}
      <section id="community" className="relative py-24 px-6 md:px-12 lg:px-20 max-w-7xl mx-auto border-t border-border/40 scroll-mt-24">
        <div
          className="relative rounded-3xl overflow-hidden bg-white/[0.02] border border-white/[0.1]  p-8 md:p-16 text-center shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.08),0_24px_60px_-15px_rgba(0,0,0,0.8)] gsap-section"
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(52,211,153,0.08)_0%,_transparent_70%)] pointer-events-none" />
          <div className="relative z-10 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs text-primary font-medium tracking-wider uppercase mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              JOIN CAMPUS LIVE
            </div>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground leading-tight mb-4">
              Beyond the lecture hall.<br />
              <span className="text-primary">Where college happens.</span>
            </h2>
            <p className="text-muted-foreground text-sm md:text-base font-light mb-8 max-w-lg mx-auto leading-relaxed">
              Join students from every department. Reserve seats, connect with clubs, and take your university journey further.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <button
                type="button"
                className="bg-primary text-primary-foreground hover:brightness-110 px-8 py-4 rounded-xl text-sm font-semibold transition-all duration-200 active:scale-[0.97] cursor-pointer shadow-[0_4px_20px_rgba(52,211,153,0.2)]"
                onClick={() => navigate('/events')}
>
                Explore All Events →
              </button>
              <button
                type="button"
                className="bg-white/10 hover:bg-white/15 text-foreground border border-white/15  px-8 py-4 rounded-xl text-sm font-semibold transition-all duration-200 active:scale-[0.97] cursor-pointer"
                onClick={() => navigate('/register')}
>
                Join the Campus
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 9. Sleek Modern Dark Footer */}
      <footer className="border-t border-border/40 bg-hero-bg py-16 px-6 md:px-12 lg:px-20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div>
            <Link to="/" className="text-foreground text-xl font-semibold tracking-tight flex items-center gap-1.5 mb-2">
              <span>CAMPUS</span>
              <span className="text-primary text-xs font-bold px-1.5 py-0.5 rounded bg-primary/10 border border-primary/20 tracking-wider">
                LIVE
              </span>
            </Link>
            <p className="text-xs text-muted-foreground max-w-sm font-light leading-relaxed">
              The official real-time event discovery and seat reservation portal. Built for students, organizers, and campus communities.
            </p>
          </div>

          <div className="flex flex-wrap gap-8 text-xs text-muted-foreground uppercase tracking-widest">
            <a href="#events" className="hover:text-foreground transition-colors">Events</a>
            <a href="#categories" className="hover:text-foreground transition-colors">Categories</a>
            <a href="#architecture" className="hover:text-foreground transition-colors">Architecture</a>
            <a href="#clubs" className="hover:text-foreground transition-colors">Clubs</a>
            <a href="#community" className="hover:text-foreground transition-colors">Community</a>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-border/20 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-muted-foreground/60 font-light">
          <p>© 2026 Campus Live. Official University Event Portal.</p>
          <p>ACID Concurrency Guarantee · MongoDB Replica Set · Real-time attendance</p>
        </div>
      </footer>
    </div>
  );
}
  