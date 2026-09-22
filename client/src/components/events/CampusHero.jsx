import { useState } from 'react';
import { Link } from 'react-router-dom';
import { dateLabel, titleCase } from '../../lib/events';
import './CampusHero.css';

function CampusSculpture() {
  return (
    <svg className="campus-sculpture" viewBox="0 0 700 700" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="sculpture-wire" x1="120" y1="80" x2="520" y2="620" gradientUnits="userSpaceOnUse">
          <stop stopColor="#d0ffdb" /><stop offset=".32" stopColor="#00ed64" />
          <stop offset=".7" stopColor="#147340" /><stop offset="1" stopColor="#00ed64" />
        </linearGradient>
        <radialGradient id="sculpture-haze"><stop stopColor="#00ed64" stopOpacity=".16" /><stop offset="1" stopColor="#00ed64" stopOpacity="0" /></radialGradient>
      </defs>
      <circle cx="350" cy="350" r="330" fill="url(#sculpture-haze)" />
      <g transform="translate(350 350) rotate(-32)">
        {Array.from({ length: 34 }, (_, i) => (
          <ellipse key={i} rx={118 + Math.sin(i / 33 * Math.PI) * 134} ry="242"
            transform={`rotate(${i * 180 / 34})`} stroke="url(#sculpture-wire)"
            strokeWidth={i % 6 === 0 ? '1.4' : '.7'} opacity={.45 + i / 70} />
        ))}
        <ellipse rx="108" ry="111" fill="#09130e" stroke="#7dffa5" strokeOpacity=".4" />
      </g>
      <path d="M50 350H105M595 350H650M350 50V105M350 595V650" stroke="#a7c9b2" strokeOpacity=".4" />
    </svg>
  );
}

export default function CampusHero({ event }) {
  const [failedImage, setFailedImage] = useState(null);
  const hasImage = event?.bannerUrl && failedImage !== event.bannerUrl;
  return (
    <section className="campus-hero" aria-labelledby="campus-hero-title">
      <div className="campus-hero-grid" aria-hidden="true" />
      <div className="container campus-hero-inner">
        <div className="campus-hero-topline"><span><i /> THE CAMPUS, OFF SCRIPT.</span><span>IDEAS / PEOPLE / POSSIBILITIES</span></div>
        <div className="campus-hero-stage">
          <div className="campus-hero-copy">
            <h1 id="campus-hero-title"><span>Beyond</span><span>the lecture</span><em>hall.</em></h1>
            <div className="campus-hero-intro"><span className="intro-rule" aria-hidden="true" /><p>Your best stories won’t happen in a classroom.<br />Find your people. Chase an idea. Show up for something.</p></div>
            <div className="campus-hero-actions"><Link className="hero-primary" to="/events">Explore events <span aria-hidden="true">↗</span></Link><Link className="hero-secondary" to="/clubs">Find your community <span aria-hidden="true">↗</span></Link></div>
          </div>
          <div className="campus-hero-visual">
            <span className="sculpture-caption">A SPACE FOR<br /><strong>WHAT’S NEXT.</strong></span>
            {hasImage ? <img className="campus-hero-photo" src={event.bannerUrl} alt={event.title} fetchpriority="high" onError={() => setFailedImage(event.bannerUrl)} /> : <CampusSculpture />}
            <span className="sculpture-index" aria-hidden="true">OPEN MINDS.<br />ENDLESS POSSIBILITIES.</span>
            <span className="sculpture-seal" aria-hidden="true">✳</span>
          </div>
        </div>
        <div className="campus-hero-bottom">
          <a className="hero-scroll" href="#discover"><span aria-hidden="true">↓</span> SCROLL INTO SOMETHING GOOD</a>
          {event ? <Link className="hero-event-ticket" to={`/events/${event.slug}`}><div className="ticket-date"><strong>{dateLabel(event.startAt, { day: '2-digit', month: undefined, year: undefined })}</strong><span>{dateLabel(event.startAt, { month: 'short', day: undefined, year: undefined })}</span></div><div className="ticket-copy"><span>{event.isFeatured ? 'IN THE SPOTLIGHT' : 'ON THE HORIZON'} / {titleCase(event.category)}</span><h2>{event.title}</h2></div><span className="ticket-arrow" aria-hidden="true">↗</span></Link> : <p className="hero-event-promise">LESS ROUTINE.<br /><strong>MORE POSSIBILITY.</strong></p>}
        </div>
      </div>
    </section>
  );
}
