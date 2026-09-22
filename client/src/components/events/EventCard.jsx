import { Link } from 'react-router-dom';
import { EventImage } from '../ui';
import { dateLabel, timeLabel, seats, titleCase } from '../../lib/events';

export default function EventCard({ event, variant = 'standard' }) {
  const remaining = seats(event);
  return (
    <article className={`event-card event-card-${variant}`}>
      <Link to={`/events/${event.slug}`} className="card-image-link" tabIndex={-1} aria-hidden="true">
        <EventImage src={event.bannerUrl} alt={event.title} />
        <span className="image-arrow">↗</span>
      </Link>
      <div className="card-copy">
        <div className="card-meta">
          <span className="badge">{titleCase(event.category)}</span>
          <span className="card-date">{dateLabel(event.startAt)}</span>
        </div>
        <h3>
          <Link to={`/events/${event.slug}`}>{event.title}</Link>
        </h3>
        <p>
          <span className="text-foreground/90 font-medium">{event.club?.name || 'Campus community'}</span>
          <span className="dot">·</span>
          <span>{event.venue?.name || 'Venue to be announced'}</span>
        </p>
        <div className="card-bottom">
          <span className="card-capacity-pill">
            <span className={`capacity-dot ${remaining === 0 ? 'capacity-full' : 'capacity-available'}`} />
            {timeLabel(event.startAt)}{remaining !== null && ` · ${remaining ? `${remaining} seats left` : 'Fully booked'}`}
          </span>
          <Link to={`/events/${event.slug}`} aria-label={`View ${event.title}`}>
            View event ↗
          </Link>
        </div>
      </div>
    </article>
  );
}
