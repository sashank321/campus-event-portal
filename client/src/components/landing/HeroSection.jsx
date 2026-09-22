import React, { Suspense, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const Spline = React.lazy(() => import('@splinetool/react-spline'));

export default function HeroSection() {
  const navigate = useNavigate();
  const [splineLoaded, setSplineLoaded] = useState(false);
  const [isInView, setIsInView] = useState(true);
  const heroRef = useRef(null);
  const splineWrapperRef = useRef(null);
  const splineAppRef = useRef(null);

  useEffect(() => {
    if (!heroRef.current || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      { threshold: 0.01 }
    );
    observer.observe(heroRef.current);
    return () => observer.disconnect();
  }, []);

  const handleSplineLoad = (app) => {
    splineAppRef.current = app;
    setSplineLoaded(true);
    if (!isInView && app.stop) {
      app.stop();
    }
  };

  // Stop WebGL rendering loop when scrolled past hero, resume when back in view
  useEffect(() => {
    const app = splineAppRef.current;
    if (!app) return;

    if (isInView) {
      if (typeof app.play === 'function') {
        app.play();
      }
    } else {
      if (typeof app.stop === 'function') {
        app.stop();
      }
    }
  }, [isInView]);

  // Pass-through wheel events to window/Lenis while allowing mousemove interaction
  useEffect(() => {
    const el = splineWrapperRef.current;
    if (!el) return;

    const handleWheelCapture = (e) => {
      // Do not allow Spline to hijack or preventDefault the scroll wheel
      e.stopImmediatePropagation();
    };

    el.addEventListener('wheel', handleWheelCapture, { capture: true, passive: true });
    return () => {
      el.removeEventListener('wheel', handleWheelCapture, { capture: true });
    };
  }, []);

  return (
    <section
      ref={heroRef}
      className="relative min-h-[92vh] md:min-h-[90vh] lg:min-h-screen flex items-center bg-hero-bg overflow-hidden pt-28 pb-14 md:pt-36 md:pb-20"
      style={{ touchAction: 'pan-y' }}
    >
      {/* Ambient background glow and grid */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        {/* Radial green ambient lights */}
        <div className="absolute top-1/4 right-1/4 w-[45vw] h-[45vw] rounded-full bg-primary/10 blur-[140px]" />
        <div className="absolute bottom-10 left-1/4 w-[32vw] h-[32vw] rounded-full bg-primary/5 blur-[120px]" />
        {/* Subtle tech grid */}
        <div
          className="absolute inset-0 opacity-[0.10]"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.12) 1px, transparent 1px)',
            backgroundSize: '72px 72px',
          }}
        />
      </div>

      {/* Spline 3D Interactive Canvas - suspended when offscreen, active & interactive when in view */}
      <div
        ref={splineWrapperRef}
        className={`absolute inset-0 z-0 transition-opacity duration-500 ${
          isInView && splineLoaded ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        style={{
          contain: 'strict',
          visibility: isInView ? 'visible' : 'hidden',
        }}
      >
        <Suspense fallback={null}>
          <Spline
            scene="https://prod.spline.design/Slk6b8kz3LRlKiyk/scene.splinecode"
            className="w-full h-full"
            onLoad={handleSplineLoad}
          />
        </Suspense>
      </div>

      {/* Dark gradient overlay for contrast while preserving 3D visibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-hero-bg via-hero-bg/50 to-black/25 z-[1] pointer-events-none" />

      {/* Main hero content container */}
      <div className="container relative z-10 pointer-events-none flex items-center justify-between gap-12">
        {/* Left Narrative Column */}
        <div className="w-full max-w-2xl lg:max-w-[620px] pt-4 md:pt-8">
          {/* Top Eyebrow Badge */}
          <div
            className="animate-fade-up inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.1]  text-xs tracking-wider text-muted-foreground uppercase font-medium mb-5 shadow-[0_0_20px_rgba(52,211,153,0.06)]"
            style={{ animationDelay: '0.1s' }}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            <span className="text-foreground font-semibold">CAMPUS LIVE</span>
            <span className="text-muted-foreground/40">·</span>
            <span className="text-foreground/80 font-mono text-[11px]">DISCOVER & ATTEND</span>
          </div>

          {/* Heading */}
          <h1
            className="animate-fade-up text-[clamp(2.9rem,7.5vw,5.6rem)] font-extrabold leading-[1.03] tracking-[-0.04em] mb-4 uppercase select-none"
            style={{ animationDelay: '0.2s' }}
          >
            <span className="bg-gradient-to-b from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent">
              CAMPUS
            </span>{' '}
            <span className="bg-gradient-to-r from-primary via-emerald-300 to-teal-300 bg-clip-text text-transparent">
              EVENTS
            </span>
          </h1>

          {/* Subheading */}
          <p
            className="animate-fade-up text-foreground/90 text-[clamp(1.15rem,2.1vw,1.55rem)] font-light leading-snug mb-3.5"
            style={{ animationDelay: '0.38s' }}
          >
            Beyond the lecture hall. Where university happens.
          </p>

          {/* Description */}
          <p
            className="animate-fade-up text-muted-foreground text-[clamp(0.875rem,1.35vw,1.06rem)] font-normal leading-relaxed mb-7 max-w-xl text-zinc-400"
            style={{ animationDelay: '0.52s' }}
          >
            Hackathons, technical symposiums, cultural nights, and student societies. Real-time registrations backed by transactional capacity. Find your community and claim your spot.
          </p>

          {/* Feature Pills */}
          <div
            className="animate-fade-up flex flex-wrap items-center gap-2.5 mb-7 text-xs font-medium"
            style={{ animationDelay: '0.65s' }}
          >
            <span className="px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.09]  flex items-center gap-2 text-zinc-200">
              <svg className="w-3.5 h-3.5 text-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              50+ Verified Events
            </span>
            <span className="px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.09]  flex items-center gap-2 text-zinc-200">
              <svg className="w-3.5 h-3.5 text-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
              </svg>
              20+ Recognized Clubs
            </span>
            <span className="px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.09]  flex items-center gap-2 text-zinc-200">
              <svg className="w-3.5 h-3.5 text-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z" />
              </svg>
              Instant Digital Pass
            </span>
          </div>

          {/* Two CTA buttons */}
          <div
            className="animate-fade-up flex flex-wrap gap-3.5 font-bold"
            style={{ animationDelay: '0.74s' }}
          >
            <button
              type="button"
              className="pointer-events-auto bg-primary text-primary-foreground px-7 py-3.5 md:px-8 md:py-4 text-sm font-semibold rounded-xl cursor-pointer hover:brightness-110 shadow-[0_4px_30px_rgba(52,211,153,0.3)] hover:shadow-[0_4px_40px_rgba(52,211,153,0.45)] transition-all active:scale-[0.97] flex items-center gap-2 group"
              onClick={() => {
                if (window.__lenis) {
                  window.__lenis.scrollTo('#events', { offset: -80, duration: 1.15 });
                } else {
                  const el = document.getElementById('events');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                  else navigate('/events');
                }
              }}
            >
              <span>Explore Events</span>
              <span className="transition-transform group-hover:translate-x-1" aria-hidden="true">→</span>
            </button>
            <button
              type="button"
              className="pointer-events-auto bg-white/[0.04] hover:bg-white/[0.08] text-foreground border border-white/[0.12] hover:border-white/[0.22]  px-7 py-3.5 md:px-8 md:py-4 text-sm font-semibold rounded-xl cursor-pointer transition-all active:scale-[0.97]"
              onClick={() => {
                if (window.__lenis) {
                  window.__lenis.scrollTo('#clubs', { offset: -80, duration: 1.15 });
                } else {
                  const el = document.getElementById('clubs');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                  else navigate('/clubs');
                }
              }}
            >
              Meet the Clubs
            </button>
          </div>

          {/* Trust line */}
          <p
            className="animate-fade-up text-muted-foreground/60 text-xs font-light mt-5 md:mt-6 tracking-wide flex items-center gap-2"
            style={{ animationDelay: '0.85s' }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-primary/70" />
            Official university event portal · Live student registrations · Real-time attendance
          </p>
        </div>

      </div>

      {/* Scroll Down Indicator Cue */}
      <button
        type="button"
        aria-label="Scroll down to explore events"
        onClick={() => {
          if (window.__lenis) {
            window.__lenis.scrollTo('#events', { offset: -80, duration: 1.15 });
          } else {
            const el = document.getElementById('events');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
            else window.scrollBy({ top: 500, behavior: 'smooth' });
          }
        }}
        className="pointer-events-auto absolute bottom-6 right-6 md:bottom-8 md:right-14 z-20 flex items-center gap-3 text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground group cursor-pointer transition-colors"
      >
        <span className="hidden sm:inline font-mono text-[11px] group-hover:text-primary transition-colors">
          SCROLL DOWN
        </span>
        <div className="w-8 h-8 rounded-full border border-white/15 group-hover:border-primary flex items-center justify-center text-primary group-hover:translate-y-0.5 transition-all bg-black/50  shadow-md">
          ↓
        </div>
      </button>
    </section>
  );
}
