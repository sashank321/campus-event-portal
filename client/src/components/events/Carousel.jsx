import { useEffect, useRef, useState } from 'react';
import EventCard from './EventCard';

export default function Carousel({ events }) {
  const track = useRef(null);
  const drag = useRef(null);
  const [index, setIndex] = useState(0);
  function go(next) {
    const element = track.current;
    const target = Math.max(0, Math.min(next, events.length - 1));
    element.scrollTo({ left: element.children[target].offsetLeft - element.offsetLeft, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  }
  useEffect(() => {
    const element = track.current;
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) if (entry.isIntersecting) setIndex(Number(entry.target.dataset.index));
    }, { root: element, threshold: 0.65 });
    Array.from(element.children).forEach((child) => observer.observe(child));
    return () => observer.disconnect();
  }, [events.length]);
  if (!events.length) return null;
  return <section className="carousel" aria-label="Event highlights" aria-roledescription="carousel">
    <div className="carousel-track" ref={track} tabIndex={0} aria-label="Event slides. Use left and right arrow keys."
      onKeyDown={(e) => { if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) { e.preventDefault(); go(e.key === 'Home' ? 0 : e.key === 'End' ? events.length - 1 : index + (e.key === 'ArrowRight' ? 1 : -1)); } }}
      onPointerDown={(e) => { if (e.pointerType === 'mouse' && e.button === 0) drag.current = { x: e.clientX, left: e.currentTarget.scrollLeft, moved: false }; }}
      onPointerMove={(e) => { const d = drag.current; if (d && Math.abs(e.clientX - d.x) > 6) { d.moved = true; e.currentTarget.scrollLeft = d.left - (e.clientX - d.x); } }}
      onPointerUp={() => { if (drag.current?.moved) setTimeout(() => { drag.current = null; }, 0); else drag.current = null; }}
      onPointerLeave={() => { drag.current = null; }} onDragStart={(e) => e.preventDefault()}
      onClickCapture={(e) => { if (drag.current?.moved) { e.preventDefault(); e.stopPropagation(); } }}>
      {events.map((event, i) => <div className="carousel-slide" key={event._id} data-index={i} role="group" aria-roledescription="slide" aria-label={`${i + 1} of ${events.length}`}><EventCard event={event} variant="featured" /></div>)}
    </div>
    {events.length > 1 && <div className="carousel-controls"><div className="carousel-dots">{events.map((event, i) => <button key={event._id} className={index === i ? 'active' : ''} aria-label={`Go to slide ${i + 1}`} aria-current={index === i ? 'true' : undefined} onClick={() => go(i)} />)}</div><span className="carousel-count" aria-live="polite">{String(index + 1).padStart(2, '0')} <span>/ {String(events.length).padStart(2, '0')}</span></span><button className="icon-button" onClick={() => go(index - 1)} disabled={index === 0} aria-label="Previous event">←</button><button className="icon-button" onClick={() => go(index + 1)} disabled={index === events.length - 1} aria-label="Next event">→</button></div>}
  </section>;
}
