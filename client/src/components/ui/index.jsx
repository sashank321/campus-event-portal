import { useEffect, useRef, useState } from 'react';

export function SectionHeader({ kicker, title, children }) {
  return <header className="section-header"><div><p className="eyebrow">{kicker}</p><h2>{title}</h2></div>{children}</header>;
}
export function Skeleton({ count = 3 }) {
  return <div className="event-grid" role="status" aria-label="Loading campus events">{Array.from({ length: count }, (_, i) => <div className="skeleton" key={i}><div /><span /><span /></div>)}</div>;
}
export function EmptyState({ title = 'A little quiet, for now.', children }) {
  return <div className="empty-state"><div className="empty-orbit" aria-hidden="true">✳</div><h2>{title}</h2><div>{children}</div></div>;
}
export function ErrorState({ title = 'We couldn’t load these events.', error, retry }) {
  return <div className="empty-state" role="alert"><p className="eyebrow">Connection interrupted</p><h2>{title}</h2><p>{error?.message || 'Please try again to reconnect to the campus server.'}</p>{retry && <button className="button button-secondary" onClick={retry}>Try again ↻</button>}</div>;
}
export function EventImage({ src, alt = '', className = '', eager = false }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  return <div className={`event-image ${className}`}>
    {src && !failed ? (
      <img src={src} alt={alt} loading={eager ? 'eager' : 'lazy'} onError={() => setFailed(true)} />
    ) : (
      <div className="image-fallback" role="img" aria-label={alt || 'Campus event artwork'}>
        <div className="fallback-art" aria-hidden="true">
          <div className="fallback-grid-mesh" />
          <svg className="fallback-contour-lines" viewBox="0 0 400 250" fill="none">
            <path d="M-20,190 Q90,50 220,130 T420,70" stroke="rgba(52,211,153,0.22)" strokeWidth="1.5" />
            <path d="M-20,140 Q130,220 270,90 T420,170" stroke="rgba(255,255,255,0.09)" strokeWidth="1" />
            <path d="M-20,90 Q170,160 300,60 T420,120" stroke="rgba(52,211,153,0.12)" strokeWidth="1" strokeDasharray="3 3" />
            <circle cx="270" cy="90" r="3" fill="#34d399" />
            <circle cx="220" cy="130" r="2" fill="rgba(255,255,255,0.6)" />
          </svg>
          <div className="fallback-card-chip">
            <span className="fallback-chip-dot" />
            <span className="fallback-chip-label">CAMPUS LIVE</span>
          </div>
        </div>
      </div>
    )}
  </div>;
}
export function Sheet({ open, onClose, title, children }) {
  const ref = useRef(null);
  useEffect(() => {
    const dialog = ref.current;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);
  return <dialog ref={ref} className="sheet" onCancel={onClose} onClose={onClose} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }} aria-label={title}><div className="sheet-content"><div className="section-header"><h2>{title}</h2><button className="icon-button" onClick={onClose} aria-label={`Close ${title}`}>×</button></div>{children}</div></dialog>;
}
export function Pagination({ meta, onPage }) {
  if (!meta || meta.totalPages <= 1) return null;
  return <nav className="pagination" aria-label="Results pages"><button className="button button-secondary" disabled={meta.page <= 1} onClick={() => onPage(meta.page - 1)}>← Previous</button><span>Page {meta.page} / {meta.totalPages}</span><button className="button button-secondary" disabled={meta.page >= meta.totalPages} onClick={() => onPage(meta.page + 1)}>Next →</button></nav>;
}
