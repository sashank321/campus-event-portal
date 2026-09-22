import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventsRequest, cancelEventRequest } from '../../api/client';
import { dateLabel, timeLabel, seats } from '../../lib/events';
import { statusBadge, registrationAvailability } from '../../lib/organizer';
import { Skeleton, ErrorState, EventImage, Pagination } from '../../components/ui';
import CancelEventDialog from '../../components/organizer/CancelEventDialog';

export default function OrganizerEvents() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [cancelTarget, setCancelTarget] = useState(null);

  const page = parseInt(searchParams.get('page') || '1', 10);
  const statusFilter = searchParams.get('status') || 'all';
  const searchTerm = searchParams.get('search') || '';

  const query = useQuery({
    queryKey: ['organizer', 'events-list', page, searchTerm],
    queryFn: ({ signal }) =>
      eventsRequest(
        {
          page,
          limit: 12,
          ...(searchTerm ? { search: searchTerm } : {}),
        },
        signal
      ),
    staleTime: 30_000,
  });

  const cancelMutation = useMutation({
    mutationFn: ({ id }) => cancelEventRequest(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['organizer'] });
      void queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });

  const events = query.data?.data || [];
  const meta = query.data?.meta;

  const filteredEvents = events.filter((e) => {
    if (statusFilter === 'all') return true;
    return e.status === statusFilter;
  });

  function updateSearch(values) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      Object.entries(values).forEach(([k, v]) => {
        if (v === undefined || v === null || v === '') next.delete(k);
        else next.set(k, String(v));
      });
      return next;
    });
  }

  return (
    <div className="stack" style={{ gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Managed Events</h2>
          <p className="muted" style={{ fontSize: '0.875rem', margin: '0.25rem 0 0' }}>
            Track approvals, registration capacities, and event schedules.
          </p>
        </div>
        <Link className="button" to="/organizer/events/new">
          + Create New Event
        </Link>
      </div>

      {/* Controls & Search */}
      <div className="panel" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', padding: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {['all', 'approved', 'pending', 'cancelled'].map((tab) => (
            <button
              key={tab}
              type="button"
              className={`button button-small ${statusFilter === tab ? '' : 'button-secondary'}`}
              onClick={() => updateSearch({ status: tab === 'all' ? undefined : tab, page: undefined })}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem', width: '100%', maxWidth: '320px' }}>
          <input
            type="search"
            placeholder="Filter by title or tag…"
            defaultValue={searchTerm}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                updateSearch({ search: e.currentTarget.value.trim() || undefined, page: undefined });
              }
            }}
            style={{ width: '100%', fontSize: '0.875rem' }}
          />
        </div>
      </div>

      {query.isPending ? (
        <Skeleton count={3} />
      ) : query.isError ? (
        <ErrorState title="We couldn’t load the events list." error={query.error} retry={query.refetch} />
      ) : filteredEvents.length === 0 ? (
        <div className="empty-state">
          <div className="empty-orbit" aria-hidden="true">✳</div>
          <h2>No matching events found.</h2>
          <p>Try clearing your filters or create a new campus event.</p>
          <Link className="button button-secondary" to="/organizer/events/new">
            Create Event
          </Link>
        </div>
      ) : (
        <>
          <div className="stack" style={{ gap: '1rem' }}>
            {filteredEvents.map((ev) => {
              const badge = statusBadge(ev.status);
              const remaining = seats(ev);
              const avail = registrationAvailability(ev);
              const isCancelled = ev.status === 'cancelled';

              return (
                <article key={ev._id} className="organizer-event-card">
                  <div className="event-top-bar">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span className={badge.className}>{badge.label}</span>
                      <span className="badge" style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8' }}>
                        {ev.category}
                      </span>
                      <span className="muted" style={{ fontSize: '0.8125rem' }}>
                        {dateLabel(ev.startAt)} · {timeLabel(ev.startAt)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem' }}>
                      <span className="muted">Registration:</span>
                      <strong style={{ color: avail === 'Open' ? '#34d399' : '#f87171' }}>{avail}</strong>
                      <span className="muted">·</span>
                      <span>
                        {ev.registeredCount || 0} / {ev.capacity != null ? ev.capacity : '∞'} seats
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    <div style={{ width: '90px', height: '60px', flexShrink: 0, borderRadius: '6px', overflow: 'hidden' }}>
                      <EventImage src={ev.bannerUrl} alt={ev.title} />
                    </div>
                    <div style={{ flexGrow: 1 }}>
                      <h3 style={{ margin: 0, fontSize: '1.25rem' }}>
                        <Link to={`/organizer/events/${ev.slug}`} style={{ color: '#f8fafc', textDecoration: 'none' }}>
                          {ev.title}
                        </Link>
                      </h3>
                      <p className="muted" style={{ margin: '0.25rem 0 0', fontSize: '0.8125rem' }}>
                        Club: {ev.club?.name || 'Campus Club'} · Venue: {ev.venue?.name || 'Venue TBA'}
                      </p>
                    </div>
                  </div>

                  <div className="event-actions-bar">
                    <Link className="button button-small" to={`/organizer/events/${ev.slug}`}>
                      Manage
                    </Link>
                    <Link className="button button-small button-secondary" to={`/organizer/events/${ev.slug}/participants`}>
                      Participants ({ev.registeredCount || 0})
                    </Link>
                    <Link className="button button-small button-secondary" to={`/organizer/events/${ev.slug}/check-in`}>
                      Check-In
                    </Link>
                    <Link className="button button-small button-secondary" to={`/organizer/events/${ev.slug}/gallery`}>
                      Gallery
                    </Link>
                    {!isCancelled && (
                      <Link className="button button-small button-secondary" to={`/organizer/events/${ev.slug}/edit`}>
                        Edit
                      </Link>
                    )}
                    {!isCancelled && (
                      <button
                        type="button"
                        className="text-button danger"
                        onClick={() => setCancelTarget(ev)}
                        style={{ fontSize: '0.8125rem', marginLeft: '0.5rem' }}
                      >
                        Cancel event
                      </button>
                    )}
                    <Link className="text-link" to={`/events/${ev.slug}`} style={{ marginLeft: 'auto', fontSize: '0.8125rem' }}>
                      Public View ↗
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>

          <Pagination meta={meta} onPage={(p) => updateSearch({ page: p })} />
        </>
      )}

      {cancelTarget && (
        <CancelEventDialog
          event={cancelTarget}
          onConfirm={(target) => cancelMutation.mutateAsync({ id: target._id })}
          onClose={() => setCancelTarget(null)}
        />
      )}
    </div>
  );
}
