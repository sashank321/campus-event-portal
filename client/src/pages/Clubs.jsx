import { Link, useParams } from 'react-router-dom';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { eventsRequest, detailRequest } from '../api/client';
import { EventImage, Skeleton, ErrorState, EmptyState, SectionHeader } from '../components/ui';
import EventCard from '../components/events/EventCard';

function useClubEvents(slug) {
  return useInfiniteQuery({ queryKey: ['events', 'clubs', slug || 'directory'], initialPageParam: 1,
    queryFn: ({ pageParam, signal }) => eventsRequest({ limit: 24, page: pageParam, sort: 'startAt', ...(slug ? { club: slug } : {}) }, signal),
    getNextPageParam: (page) => page.meta.page < page.meta.totalPages ? page.meta.page + 1 : undefined,
  });
}
function More({ query }) {
  return <>{query.isFetchNextPageError && <ErrorState title="More events couldn’t be loaded." error={query.error} retry={query.fetchNextPage} />}{query.hasNextPage && <button className="button button-secondary load-more" disabled={query.isFetchingNextPage} onClick={() => query.fetchNextPage()}>{query.isFetchingNextPage ? 'Loading…' : 'Load more published events ↓'}</button>}</>;
}
export default function Clubs() {
  const query = useClubEvents();
  const clubs = [...new Map((query.data?.pages.flatMap((page) => page.data) || []).filter((event) => event.club?.slug).map((event) => [event.club.slug, event.club])).values()];
  return <div className="container page"><header className="page-heading"><p className="eyebrow">FIND YOUR PEOPLE</p><h1>A shared spark.<br /><em>A whole community.</em></h1><p>Meet the clubs bringing published campus events to life.</p></header><div className="notice">This directory features clubs found in public events—not every campus club. Load more events to discover more communities.</div>
    {query.isPending ? <Skeleton /> : query.isError && !query.data ? <ErrorState title="We couldn’t load the campus communities." error={query.error} retry={query.refetch} /> : clubs.length ? <><div className="club-grid">{clubs.map((club, i) => <Link className="club-card" key={club._id} to={`/clubs/${club.slug}`}><div className="club-card-top"><span className="club-monogram">{club.logoUrl ? <EventImage src={club.logoUrl} alt={`${club.name} logo`} /> : club.name.slice(0, 2).toUpperCase()}</span><span className="muted">{String(i + 1).padStart(2, '0')} / ↗</span></div><h2>{club.name}</h2><p>Discover their published events and find your next connection.</p><span className="text-link">Meet the club ↗</span></Link>)}</div><More query={query} /></> : <EmptyState title="Communities are getting ready."><p>Clubs will appear here when their events are published.</p><Link className="button button-secondary" to="/events">Explore events</Link></EmptyState>}
  </div>;
}
export function ClubDetail() {
  const { slug } = useParams();
  const query = useClubEvents(slug);
  const events = query.data?.pages.flatMap((page) => page.data) || [];
  const first = events[0];
  const details = useQuery({ queryKey: ['event', first?.slug], queryFn: ({ signal }) => detailRequest(first.slug, signal), enabled: !!first });
  const club = details.data?.data.event.club || first?.club;
  if (query.isPending) return <div className="container page"><Skeleton /></div>;
  if (query.isError && !query.data) return <div className="container page"><ErrorState title="We couldn’t load this club’s events." error={query.error} retry={query.refetch} /></div>;
  if (!club) return <div className="container page"><EmptyState title="This club isn’t available here yet."><p>No public events expose this club’s details. It may still exist on campus.</p><Link className="button" to="/clubs">Back to clubs</Link></EmptyState></div>;
  const now = Date.now();
  const upcoming = events.filter((event) => new Date(event.startAt).getTime() >= now);
  const past = events.filter((event) => new Date(event.startAt).getTime() < now);
  return <div className="container page"><Link className="back-link" to="/clubs">← The communities</Link><header className="club-detail-heading"><span className="club-monogram">{club.logoUrl ? <EventImage src={club.logoUrl} alt={`${club.name} logo`} /> : club.name.slice(0, 2).toUpperCase()}</span><div><p className="eyebrow">A CAMPUS COMMUNITY</p><h1>{club.name}</h1><p>{club.description || 'Explore the public events shared by this campus community.'}</p></div></header>{details.isError && <div className="notice">The club description couldn’t be loaded. <button className="text-button" onClick={() => details.refetch()}>Retry</button></div>}
    <SectionHeader kicker="SHOW UP. JOIN IN." title="Coming up together." />{upcoming.length ? <div className="event-grid">{upcoming.map((event) => <EventCard event={event} key={event._id} />)}</div> : <EmptyState title="More to look forward to."><p>No upcoming events in the loaded public results.</p></EmptyState>}
    {!!past.length && <section className="section"><SectionHeader kicker="FROM THE PUBLIC CALENDAR" title="Previously on campus." /><div className="event-grid">{past.map((event) => <EventCard event={event} variant="compact" key={event._id} />)}</div></section>}<More query={query} /><p className="fine-print">Only events exposed by the public API are shown. This is not a complete event archive.</p>
  </div>;
}
