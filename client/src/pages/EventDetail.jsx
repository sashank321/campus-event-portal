import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { detailRequest } from '../api/client';
import { dateLabel, timeLabel, titleCase, seats } from '../lib/events';
import { EventImage, Skeleton, ErrorState, Sheet } from '../components/ui';
import RegistrationCTA from '../features/auth/RegistrationCTA';

export default function EventDetail() {
  const { slug } = useParams();
  const [image, setImage] = useState(null);
  const query = useQuery({ queryKey: ['event', slug], queryFn: ({ signal }) => detailRequest(slug, signal) });
  if (query.isPending) return <div className="container page"><Skeleton count={1} /></div>;
  if (query.isError) return <div className="container page"><ErrorState title={query.error.status === 404 ? 'This event isn’t public or is no longer available.' : 'We couldn’t open this event.'} error={query.error} retry={query.refetch} /><Link className="button button-secondary" to="/events">Back to events</Link></div>;
  const event = query.data.data.event;
  return <div className="detail-page"><section className="detail-hero"><EventImage src={event.bannerUrl} eager className="detail-backdrop" /><div className="container detail-heading"><Link className="back-link" to="/events">← All events</Link><p className="eyebrow">{titleCase(event.category)} <span> / </span> {event.club?.name || 'Campus events'}</p><h1>{event.title}</h1><div className="detail-metadata"><span>{dateLabel(event.startAt)} · {timeLabel(event.startAt)}</span><span>{event.venue?.name || 'Venue to be announced'}</span><span className="badge">{titleCase(event.status)}</span></div></div></section>
    <div className="container detail-layout"><div><section className="editorial-section"><p className="eyebrow">THE EXPERIENCE</p><h2>A little more about it.</h2><p className="event-description">{event.description}</p></section>
      {!!event.rules?.length && <section className="editorial-section"><p className="eyebrow">BEFORE YOU ARRIVE</p><h2>Good to know.</h2><ol className="rules">{event.rules.map((rule, i) => <li key={i}><span>{String(i + 1).padStart(2, '0')}</span>{rule}</li>)}</ol></section>}
      {!!event.tags?.length && <div className="tags">{event.tags.map((tag) => <span key={tag}>#{tag}</span>)}</div>}
      {!!event.gallery?.length && <section className="editorial-section"><h2>In the frame.</h2><div className="gallery">{event.gallery.map((item) => <button key={item.url} onClick={() => setImage(item)} aria-label={`Enlarge ${item.caption || 'event image'}`}><EventImage src={item.url} alt={item.caption || event.title} /></button>)}</div></section>}
      {event.club && <section className="club-byline"><p className="eyebrow">BROUGHT TO YOU BY</p><h2>{event.club.name}</h2><p>{event.club.description}</p><Link className="text-link" to={`/clubs/${event.club.slug}`}>Meet the club ↗</Link></section>}
    </div><aside><div className="registration-panel panel"><p className="eyebrow">MAKE IT A PLAN</p><h2>Your place is here.</h2><dl><div><dt>When</dt><dd>{dateLabel(event.startAt)}<br />{timeLabel(event.startAt)} — {timeLabel(event.endAt)}</dd></div><div><dt>Where</dt><dd>{event.venue?.name || 'To be announced'}{event.venue?.building && <small>{event.venue.building}</small>}</dd></div><div><dt>Availability</dt><dd>{seats(event) == null ? 'Open capacity' : `${seats(event)} seats remaining`}</dd></div><div><dt>Register before</dt><dd>{dateLabel(event.registrationDeadline)} · {timeLabel(event.registrationDeadline)}</dd></div></dl><RegistrationCTA event={event} /><p className="fine-print">Times are shown in your local timezone.</p></div></aside></div>
    <Sheet open={!!image} onClose={() => setImage(null)} title="Event gallery">{image && <><EventImage src={image.url} alt={image.caption || event.title} /><p>{image.caption}</p></>}</Sheet>
  </div>;
}
