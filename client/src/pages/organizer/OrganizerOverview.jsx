import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { eventsRequest } from '../../api/client';
import { useAuth } from '../../features/auth/AuthContext';
import { dateLabel, timeLabel, seats } from '../../lib/events';
import { statusBadge } from '../../lib/organizer';
import { Skeleton, ErrorState, EventImage } from '../../components/ui';

export default function OrganizerOverview() {
  const auth = useAuth();
  const query = useQuery({
    queryKey: ['organizer', 'overview-events'],
    queryFn: ({ signal }) => eventsRequest({ limit: 50 }, signal),
    staleTime: 30_000,
  });

  const events = query.data?.data || [];
  const loading = query.isPending;
  const error = query.error;

  // Derive real statistics from backend-retrieved events
  const totalEvents = query.data?.meta?.total || events.length;
  const totalRegistrations = events.reduce((sum, e) => sum + (e.registeredCount || 0), 0);
  const totalCapacity = events.reduce((sum, e) => sum + (e.capacity || 0), 0);
  const fillRate = totalCapacity > 0 ? Math.round((totalRegistrations / totalCapacity) * 100) : null;

  const now = Date.now();
  const upcomingEvents = events.filter((e) => new Date(e.startAt).getTime() >= now);
  const nextEvent = upcomingEvents[0] || null;

  return (
    <div className="stack" style={{ gap: '2rem' }}>
      {/* KPI Blocks */}
      <section aria-label="Operational Summary">
        <div className="kpi-grid">
          <div className="kpi-card">
            <span className="kpi-label">Active Campus Events</span>
            <span className="kpi-value">{loading ? '—' : totalEvents}</span>
            <span className="kpi-sub">Public & scheduled events</span>
          </div>
          <div className="kpi-card">
            <span className="kpi-label">Total Registrations</span>
            <span className="kpi-value">{loading ? '—' : totalRegistrations}</span>
            <span className="kpi-sub">Across visible campus events</span>
          </div>
          <div className="kpi-card">
            <span className="kpi-label">Capacity Fill Rate</span>
            <span className="kpi-value">{loading ? '—' : fillRate != null ? `${fillRate}%` : 'Open'}</span>
            <span className="kpi-sub">{totalCapacity > 0 ? `${totalCapacity} total seats` : 'No hard limit'}</span>
          </div>
          <div className="kpi-card">
            <span className="kpi-label">Next Scheduled</span>
            <span className="kpi-value" style={{ fontSize: '1.25rem', fontWeight: 600 }}>
              {loading ? '—' : nextEvent ? nextEvent.title : 'None scheduled'}
            </span>
            <span className="kpi-sub">
              {nextEvent ? `${dateLabel(nextEvent.startAt)}` : 'Create your next event'}
            </span>
          </div>
        </div>
      </section>

      {/* Quick Action Banner */}
      <section className="panel stack" style={{ background: 'rgba(16, 185, 129, 0.04)', borderColor: 'rgba(16, 185, 129, 0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>Plan a new campus experience</h2>
            <p className="muted" style={{ margin: '0.25rem 0 0', fontSize: '0.875rem' }}>
              Publish workshops, competitions, cultural fests, or sports meets directly to campus life.
            </p>
          </div>
          <Link className="button" to="/organizer/events/new">
            + Create Event
          </Link>
        </div>
      </section>

      {/* Operational Events List */}
      <section aria-labelledby="recent-events-heading">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 id="recent-events-heading" style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>
            Recent Events
          </h2>
          <Link className="text-link" to="/organizer/events">
            View all events →
          </Link>
        </div>

        {loading ? (
          <Skeleton count={2} />
        ) : error ? (
          <ErrorState title="Could not load organizer events." error={error} retry={query.refetch} />
        ) : events.length === 0 ? (
          <div className="empty-state">
            <div className="empty-orbit" aria-hidden="true">✳</div>
            <h2>No campus events active yet.</h2>
            <p>Get started by publishing the first event for your club or department.</p>
            <Link className="button" to="/organizer/events/new">
              Create an Event
            </Link>
          </div>
        ) : (
          <div className="stack" style={{ gap: '1rem' }}>
            {events.slice(0, 5).map((ev) => {
              const remaining = seats(ev);
              return (
                <div key={ev._id} className="organizer-event-card">
                  <div className="event-top-bar">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <span className="badge-approved">Approved</span>
                      <span className="muted" style={{ fontSize: '0.8125rem' }}>
                        {dateLabel(ev.startAt)} · {timeLabel(ev.startAt)}
                      </span>
                      <span className="muted" style={{ fontSize: '0.8125rem' }}>
                        📍 {ev.venue?.name || 'Venue TBA'}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.8125rem', color: '#10b981', fontWeight: 600 }}>
                      {ev.registeredCount || 0} registered ({remaining != null ? `${remaining} left` : 'Unlimited'})
                    </span>
                  </div>

                  <h3 style={{ margin: 0, fontSize: '1.125rem' }}>
                    <Link to={`/organizer/events/${ev.slug}`} style={{ color: '#f8fafc', textDecoration: 'none' }}>
                      {ev.title}
                    </Link>
                  </h3>

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
                    <Link className="text-link" to={`/events/${ev.slug}`} style={{ marginLeft: 'auto', fontSize: '0.8125rem' }}>
                      View public page ↗
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
