import { Link } from 'react-router-dom';
import { dateLabel, timeLabel } from '../../lib/events';
import { attendanceLabel, canCancel, statusLabel } from '../../lib/registrations';
import { EventImage } from '../ui';

export function StudentHeader({ eyebrow, title, children }) {
  return <header className="page-heading student-heading"><p className="eyebrow">{eyebrow}</p><h1>{title}</h1>{children}</header>;
}

export function RegistrationStatus({ status }) {
  return <span className={`reg-status reg-status-${status}`}>{statusLabel(status)}</span>;
}

export function RegistrationCard({ registration, onCancel, cancelPending, cancelError, upcoming }) {
  const snapshot = registration.eventSnapshot || {};
  const start = snapshot.startAt;
  const cancelable = canCancel(registration);
  return <article className={`reg-card ${upcoming ? 'reg-card-upcoming' : ''}`}>
    <div className="reg-card-link">
      <Link to={`/student/registrations/${registration._id}`} className="reg-card-image-link" aria-label={`Open registration for ${snapshot.title || 'event'}`}>
        <EventImage className="reg-card-image" src={snapshot.bannerUrl} alt={snapshot.title || 'Registered event artwork'} />
      </Link>
      <div className="reg-card-body">
        <div className="reg-card-top"><RegistrationStatus status={registration.status} /><span className="reg-when">{dateLabel(start)} · {timeLabel(start)}</span></div>
        <h3><Link to={`/student/registrations/${registration._id}`} className="reg-card-title-link">{snapshot.title || 'Event title unavailable'}</Link></h3>
        <p className="reg-venue">{snapshot.venue || 'Venue to be announced'}</p>
        <p className="reg-meta">Registered {dateLabel(registration.registeredAt)}{registration.status === 'cancelled' && registration.cancelledAt ? ` · Cancelled ${dateLabel(registration.cancelledAt)}` : ''}{registration.status === 'registered' && start && new Date(start).getTime() < Date.now() ? ` · ${attendanceLabel(registration)}` : ''}</p>
        <div className="reg-card-actions">
          <Link className="text-link" to={`/student/registrations/${registration._id}`}>View registration ↗</Link>
          {cancelable && onCancel && <button type="button" className="text-button danger" onClick={() => onCancel(registration)} disabled={cancelPending}>{cancelPending ? 'Cancelling…' : 'Cancel registration'}</button>}
        </div>
      </div>
    </div>
  </article>;
}

export function RegistrationTabs({ tabs, active, onSelect }) {
  return <div className="reg-tabs" role="tablist" aria-label="Registration filters">{tabs.map(([key, label]) => <button key={key} role="tab" aria-selected={active === key} className={`reg-tab ${active === key ? 'active' : ''}`} onClick={() => onSelect(key)}>{label}</button>)}</div>;
}

export function RegistrationEmptyState({ copy }) {
  return <div className="empty-state"><div className="empty-orbit" aria-hidden="true">✳</div><h2>{copy}</h2><p>There’s a whole campus calendar waiting.</p><Link className="button button-secondary" to="/events">Explore Events</Link></div>;
}
