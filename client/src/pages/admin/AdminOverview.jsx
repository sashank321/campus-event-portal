import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { eventsRequest } from '../../api/client';
import { computePlatformKPIs, adminStatusBadge } from '../../lib/admin';
import { dateLabel, seats } from '../../lib/events';

export default function AdminOverview() {
  const navigate = useNavigate();
  const [jumpSlug, setJumpSlug] = useState('');
  const [jumpError, setJumpError] = useState('');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin', 'overview-events'],
    queryFn: ({ signal }) => eventsRequest({ limit: 50 }, signal),
  });

  const events = Array.isArray(data?.data) ? data.data : (data?.data?.events || []);
  const kpis = computePlatformKPIs(events);

  const handleJump = (e) => {
    e.preventDefault();
    const clean = jumpSlug.trim();
    if (!clean) {
      setJumpError('Please enter an event slug or ID to review');
      return;
    }
    setJumpError('');
    navigate(`/admin/events/${encodeURIComponent(clean)}`);
  };

  return (
    <div className="stack" style={{ gap: '2rem' }}>
      {/* Quick Moderation Jumper */}
      <section className="review-jumper" aria-labelledby="quick-moderation-heading">
        <div>
          <h2 id="quick-moderation-heading" style={{ fontSize: '1.25rem', fontWeight: 600, margin: '0 0 0.25rem' }}>
            Event Moderation Jumper
          </h2>
          <p className="muted" style={{ fontSize: '0.875rem', margin: 0 }}>
            Inspect, approve, reject, or soft-cancel any event directly using its unique slug or ID.
          </p>
        </div>
        <form onSubmit={handleJump} className="review-jumper-form">
          <input
            type="text"
            className="review-jumper-input"
            placeholder="e.g. spring-hackathon-2026 or 65f2a1b9..."
            value={jumpSlug}
            onChange={(e) => {
              setJumpSlug(e.target.value);
              if (jumpError) setJumpError('');
            }}
            aria-label="Event slug or ID to moderate"
          />
          <button type="submit" className="button button-small">
            Open Review ↗
          </button>
        </form>
        {jumpError && <p className="form-error" role="alert">{jumpError}</p>}
      </section>

      {/* Platform KPI Blocks */}
      <section aria-labelledby="platform-kpi-heading">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 id="platform-kpi-heading" style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>
            Platform Operational Metrics
          </h2>
          <button
            type="button"
            className="button button-small button-secondary"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            {isLoading ? 'Refreshing…' : 'Refresh Metrics'}
          </button>
        </div>

        {error ? (
          <div className="notice" role="alert">
            Unable to load platform event metrics. <button className="text-button" onClick={() => refetch()}>Retry</button>
          </div>
        ) : (
          <div className="kpi-grid">
            <div className="kpi-card">
              <span className="kpi-label">Active Approved Events</span>
              <span className="kpi-value">{isLoading ? '…' : kpis.totalEvents}</span>
              <span className="kpi-hint">Live in public discovery</span>
            </div>
            <div className="kpi-card">
              <span className="kpi-label">Total Student Registrations</span>
              <span className="kpi-value">{isLoading ? '…' : kpis.totalRegistered}</span>
              <span className="kpi-hint">Across loaded events</span>
            </div>
            <div className="kpi-card">
              <span className="kpi-label">Total Platform Capacity</span>
              <span className="kpi-value">{isLoading ? '…' : kpis.totalCapacity}</span>
              <span className="kpi-hint">Seats across {kpis.cappedEventsCount} capped events</span>
            </div>
            <div className="kpi-card">
              <span className="kpi-label">Average Seat Fill Rate</span>
              <span className="kpi-value">{isLoading ? '…' : `${kpis.fillRatePercent}%`}</span>
              <span className="kpi-hint">Platform-wide utilization</span>
            </div>
          </div>
        )}
      </section>

      {/* Recent Events Moderation Table */}
      <section aria-labelledby="recent-events-heading">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h2 id="recent-events-heading" style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>
              Live Event Catalog
            </h2>
            <p className="muted" style={{ fontSize: '0.875rem', margin: '0.25rem 0 0' }}>
              Recently published approved campus events
            </p>
          </div>
          <Link to="/admin/events" className="button button-small button-secondary">
            View All Events & Queue ↗
          </Link>
        </div>

        {isLoading ? (
          <p className="muted">Loading campus events…</p>
        ) : events.length === 0 ? (
          <p className="muted">No events currently listed.</p>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Event Title</th>
                  <th>Club</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Attendance</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {events.slice(0, 8).map((event) => {
                  const badge = adminStatusBadge(event.status);
                  const remaining = seats(event);
                  return (
                    <tr key={event._id || event.slug}>
                      <td>
                        <strong style={{ display: 'block', color: '#f8fafc' }}>{event.title}</strong>
                        <span className="muted" style={{ fontSize: '0.75rem' }}>/{event.slug}</span>
                      </td>
                      <td>{event.club?.name || 'Campus Wide'}</td>
                      <td>{dateLabel(event.startAt)}</td>
                      <td>
                        <span className={badge.className}>{badge.label}</span>
                      </td>
                      <td>
                        {event.registeredCount || 0}
                        {event.capacity != null ? ` / ${event.capacity}` : ' (unlimited)'}
                        {remaining != null && remaining <= 5 && (
                          <span style={{ display: 'block', fontSize: '0.75rem', color: '#f59e0b' }}>
                            {remaining === 0 ? 'Full' : `${remaining} left`}
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                          <Link
                            to={`/admin/events/${encodeURIComponent(event.slug)}`}
                            className="button button-small"
                          >
                            Review
                          </Link>
                          <Link
                            to={`/events/${encodeURIComponent(event.slug)}`}
                            className="button button-small button-secondary"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Public ↗
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Admin Modules Quick Launch */}
      <section aria-labelledby="quick-modules-heading">
        <h2 id="quick-modules-heading" style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>
          Administrative Modules
        </h2>
        <div className="kpi-grid">
          <Link to="/admin/events" className="panel" style={{ textDecoration: 'none', color: 'inherit' }}>
            <h3 style={{ fontSize: '1.125rem', margin: '0 0 0.5rem', color: '#38bdf8' }}>Moderation Queue</h3>
            <p className="muted" style={{ fontSize: '0.8125rem', margin: 0 }}>
              Search, filter, inspect submissions, and execute approve/reject actions.
            </p>
          </Link>
          <Link to="/admin/registrations" className="panel" style={{ textDecoration: 'none', color: 'inherit' }}>
            <h3 style={{ fontSize: '1.125rem', margin: '0 0 0.5rem', color: '#38bdf8' }}>Registration Inspector</h3>
            <p className="muted" style={{ fontSize: '0.8125rem', margin: 0 }}>
              Review attendee rosters by event, export CSV, and cancel registrations.
            </p>
          </Link>
          <Link to="/admin/statistics" className="panel" style={{ textDecoration: 'none', color: 'inherit' }}>
            <h3 style={{ fontSize: '1.125rem', margin: '0 0 0.5rem', color: '#38bdf8' }}>Platform Statistics</h3>
            <p className="muted" style={{ fontSize: '0.8125rem', margin: 0 }}>
              Category & department breakdowns, platform capacity, and utilization charts.
            </p>
          </Link>
          <Link to="/admin/users" className="panel" style={{ textDecoration: 'none', color: 'inherit' }}>
            <h3 style={{ fontSize: '1.125rem', margin: '0 0 0.5rem', color: '#38bdf8' }}>Users & Permissions</h3>
            <p className="muted" style={{ fontSize: '0.8125rem', margin: 0 }}>
              Campus roles taxonomy, active session details, and API contract status.
            </p>
          </Link>
        </div>
      </section>
    </div>
  );
}
